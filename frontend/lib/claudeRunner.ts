import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import readline from "node:readline";
import { getRepoRoot } from "./repoRoot";

/**
 * Normalized events yielded by runClaudeTurn(). Every `claude -p
 * --output-format stream-json` line is one JSON object; we translate the
 * handful of shapes the UI actually needs and pass everything else through
 * as `raw` so nothing is silently dropped.
 *
 * Shapes below were confirmed empirically against the installed CLI
 * (claude 2.1.204), not assumed from docs alone:
 * - `session_id` is present at the top level of every line, including the
 *   very first one — no need to hunt for it.
 * - Permission denials show up as `result.permission_denials[]` on the
 *   final `result` event (and often earlier as a `system/post_turn_summary`
 *   with status_category "blocked") — a headless denial is a graceful
 *   auto-deny-and-continue, never a hang.
 */
export type RunnerEvent =
  | { kind: "session"; sessionId: string }
  | { kind: "text_delta"; text: string }
  | { kind: "tool_use"; name: string; input: unknown; id: string }
  | { kind: "system"; subtype: string; detail: unknown }
  | { kind: "permission_denial"; toolName: string; toolInput: unknown }
  | {
      kind: "turn_complete";
      resultText: string;
      isError: boolean;
      costUsd: number | null;
      durationMs: number | null;
      sessionId: string | null;
    }
  | { kind: "process_exit"; code: number | null }
  | { kind: "raw"; data: unknown };

export interface RunClaudeTurnOptions {
  prompt: string;
  resumeSessionId?: string;
  cwd?: string;
  signal?: AbortSignal;
}

export async function* runClaudeTurn(
  opts: RunClaudeTurnOptions,
): AsyncGenerator<RunnerEvent> {
  const cwd = opts.cwd ?? getRepoRoot();
  const args = [
    "-p",
    opts.prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--include-partial-messages",
  ];
  if (opts.resumeSessionId) {
    args.push("--resume", opts.resumeSessionId);
  }

  const child: ChildProcessByStdio<null, Readable, Readable> = spawn("claude", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const onAbort = () => {
    child.kill("SIGTERM");
  };
  opts.signal?.addEventListener("abort", onAbort);

  const rl = readline.createInterface({ input: child.stdout });

  type QueueItem = { event: RunnerEvent };
  const queue: QueueItem[] = [];
  let resolveNext: (() => void) | null = null;
  let stderrBuf = "";
  let finished = false;

  function push(event: RunnerEvent) {
    queue.push({ event });
    if (resolveNext) {
      const r = resolveNext;
      resolveNext = null;
      r();
    }
  }

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(trimmed);
    } catch {
      push({ kind: "raw", data: { unparsed: trimmed } });
      return;
    }
    for (const evt of normalizeEvent(data)) push(evt);
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderrBuf += chunk.toString();
  });

  child.on("error", (err) => {
    push({ kind: "raw", data: { spawn_error: String(err) } });
  });

  child.on("close", (code) => {
    finished = true;
    if (stderrBuf.trim()) {
      push({ kind: "raw", data: { stderr: stderrBuf.trim() } });
    }
    push({ kind: "process_exit", code });
  });

  try {
    while (true) {
      if (queue.length === 0) {
        if (finished) break;
        await new Promise<void>((resolve) => {
          resolveNext = resolve;
        });
        continue;
      }
      const item = queue.shift()!;
      yield item.event;
      if (item.event.kind === "process_exit") break;
    }
  } finally {
    opts.signal?.removeEventListener("abort", onAbort);
    if (!child.killed) child.kill("SIGTERM");
  }
}

function normalizeEvent(data: Record<string, unknown>): RunnerEvent[] {
  const events: RunnerEvent[] = [];
  const sessionId =
    typeof data.session_id === "string" ? data.session_id : undefined;
  if (sessionId) events.push({ kind: "session", sessionId });

  switch (data.type) {
    case "stream_event": {
      const inner = data.event as Record<string, unknown> | undefined;
      const delta = inner?.delta as Record<string, unknown> | undefined;
      if (inner?.type === "content_block_delta" && delta?.type === "text_delta") {
        events.push({ kind: "text_delta", text: (delta.text as string) ?? "" });
      }
      break;
    }
    case "assistant": {
      const message = data.message as Record<string, unknown> | undefined;
      const content = message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block?.type === "tool_use") {
            events.push({
              kind: "tool_use",
              name: block.name,
              input: block.input,
              id: block.id,
            });
          }
        }
      }
      break;
    }
    case "system": {
      events.push({
        kind: "system",
        subtype: typeof data.subtype === "string" ? data.subtype : "unknown",
        detail: data,
      });
      break;
    }
    case "result": {
      const denials = Array.isArray(data.permission_denials)
        ? (data.permission_denials as Array<Record<string, unknown>>)
        : [];
      for (const d of denials) {
        events.push({
          kind: "permission_denial",
          toolName: d.tool_name as string,
          toolInput: d.tool_input,
        });
      }
      events.push({
        kind: "turn_complete",
        resultText: typeof data.result === "string" ? data.result : "",
        isError: Boolean(data.is_error),
        costUsd: typeof data.total_cost_usd === "number" ? data.total_cost_usd : null,
        durationMs: typeof data.duration_ms === "number" ? data.duration_ms : null,
        sessionId: sessionId ?? null,
      });
      break;
    }
    default:
      // active_goal, rate_limit_event, and anything else: keep for the raw activity log.
      events.push({ kind: "raw", data });
  }
  return events;
}
