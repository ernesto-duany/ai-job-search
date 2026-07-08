"use client";

import { useRef, useState } from "react";
import type { ClientActionDef } from "@/lib/actions";
import type { ActivityItem, TranscriptTurn } from "@/lib/client/types";
import { readSSEStream } from "@/lib/client/sseClient";
import { Transcript } from "./Transcript";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function summarizeInput(action: ClientActionDef, input: Record<string, string>): string {
  const parts = action.fields
    .filter((f) => (input[f.key] ?? "").trim())
    .map((f) => `${f.label}: ${input[f.key]}`);
  return parts.length > 0 ? parts.join(" · ") : `Starting ${action.title}`;
}

export function ChatRunner({ action }: { action: ClientActionDef }) {
  const [input, setInput] = useState<Record<string, string>>({});
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const started = turns.length > 0;

  function setField(key: string, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function appendActivity(turnId: string, item: ActivityItem) {
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, activity: [...t.activity, item] } : t)),
    );
  }

  async function runTurn(url: string, body: unknown) {
    setBusy(true);
    setFormError(null);
    const assistantTurnId = uid();
    setTurns((prev) => [
      ...prev,
      { id: assistantTurnId, role: "assistant", text: "", activity: [], status: "streaming" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 409) {
        const info = await res.json().catch(() => ({}));
        setFormError(
          `Busy: another run (${info.activeAction ?? "unknown"}) is already active. Try again shortly.`,
        );
        setTurns((prev) => prev.filter((t) => t.id !== assistantTurnId));
        return;
      }
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        setFormError(info.message ?? info.error ?? `Request failed (${res.status})`);
        setTurns((prev) => prev.filter((t) => t.id !== assistantTurnId));
        return;
      }

      for await (const msg of readSSEStream(res, controller.signal)) {
        const evt = msg.data as Record<string, unknown>;
        switch (evt.kind) {
          case "session":
            setSessionId(evt.sessionId as string);
            break;
          case "text_delta":
            setTurns((prev) =>
              prev.map((t) =>
                t.id === assistantTurnId ? { ...t, text: t.text + (evt.text as string) } : t,
              ),
            );
            break;
          case "tool_use":
            appendActivity(assistantTurnId, {
              id: uid(),
              kind: "tool_use",
              label: `Used ${evt.name as string}`,
              detail: evt.input,
            });
            break;
          case "permission_denial":
            appendActivity(assistantTurnId, {
              id: uid(),
              kind: "permission_denial",
              label: `Denied: ${evt.toolName as string}`,
              detail: evt.toolInput,
            });
            break;
          case "system": {
            const detail = evt.detail as Record<string, unknown> | undefined;
            if (detail?.status_category === "blocked") {
              appendActivity(assistantTurnId, {
                id: uid(),
                kind: "system",
                label: (detail.status_detail as string) ?? "blocked",
                detail,
              });
            }
            break;
          }
          case "turn_complete": {
            const isError = Boolean(evt.isError);
            const resultText = (evt.resultText as string) ?? "";
            setTurns((prev) =>
              prev.map((t) =>
                t.id === assistantTurnId
                  ? {
                      ...t,
                      status: isError ? "error" : "done",
                      costUsd: evt.costUsd as number | null,
                      durationMs: evt.durationMs as number | null,
                      text: t.text || resultText,
                    }
                  : t,
              ),
            );
            if (evt.sessionId) setSessionId(evt.sessionId as string);
            break;
          }
          default:
            break;
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setFormError(err instanceof Error ? err.message : String(err));
        setTurns((prev) =>
          prev.map((t) => (t.id === assistantTurnId ? { ...t, status: "error" } : t)),
        );
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  async function handleStart() {
    setFormError(null);
    for (const f of action.fields) {
      if (f.required && !(input[f.key] ?? "").trim()) {
        setFormError(`"${f.label}" is required.`);
        return;
      }
    }
    setTurns([
      { id: uid(), role: "user", text: summarizeInput(action, input), activity: [], status: "done" },
    ]);
    await runTurn("/api/skill-runner/start", { actionId: action.id, input });
  }

  async function handleReply() {
    const text = replyText.trim();
    if (!sessionId || !text) return;
    setReplyText("");
    setTurns((prev) => [...prev, { id: uid(), role: "user", text, activity: [], status: "done" }]);
    await runTurn("/api/skill-runner/reply", { sessionId, message: text, actionId: action.id });
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleNewRun() {
    setTurns([]);
    setSessionId(null);
    setInput({});
    setFormError(null);
    setReplyText("");
  }

  return (
    <div className="flex flex-col gap-4">
      {!started && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          {action.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm">
              <span className="font-medium">
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
              </span>
              {f.kind === "textarea" && (
                <textarea
                  className="min-h-[120px] rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  placeholder={f.placeholder}
                  value={input[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {f.kind === "text" && (
                <input
                  className="rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  placeholder={f.placeholder}
                  value={input[f.key] ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
              {f.kind === "select" && (
                <select
                  className="rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  value={input[f.key] ?? f.options?.[0]?.value ?? ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {f.kind === "checkbox" && (
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={input[f.key] === "true"}
                    onChange={(e) => setField(f.key, e.target.checked ? "true" : "false")}
                  />
                  {f.help}
                </span>
              )}
              {f.help && f.kind !== "checkbox" && (
                <span className="text-xs text-neutral-500">{f.help}</span>
              )}
            </label>
          ))}
          <button
            type="button"
            onClick={handleStart}
            disabled={busy}
            className={`self-start rounded px-4 py-2 text-sm font-medium text-white ${
              action.danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            } disabled:opacity-50`}
          >
            {action.danger ? `Start (${action.title})` : "Start"}
          </button>
        </div>
      )}

      {formError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {formError}
        </div>
      )}

      <Transcript turns={turns} />

      {started && (
        <div className="flex flex-col gap-2">
          {busy ? (
            <button
              type="button"
              onClick={handleStop}
              className="self-start rounded border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-600"
            >
              Stop
            </button>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  placeholder={sessionId ? "Reply…" : "Waiting for session…"}
                  value={replyText}
                  disabled={!sessionId}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={!sessionId || !replyText.trim()}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              <button
                type="button"
                onClick={handleNewRun}
                className="self-start text-xs text-neutral-500 hover:underline"
              >
                Start a fresh run
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
