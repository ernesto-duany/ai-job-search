import { releaseLock } from "./lock";
import type { RunnerEvent } from "./claudeRunner";

/**
 * Wraps a claudeRunner generator factory into a text/event-stream Response.
 * Takes a factory (not a pre-built generator) so it can own the
 * AbortController and wire ReadableStream.cancel() (client disconnect)
 * through to actually killing the spawned `claude` child process, instead
 * of leaking an orphaned subprocess.
 */
export function createSSEResponse(
  makeGenerator: (signal: AbortSignal) => AsyncGenerator<RunnerEvent>,
  opts: { onExit?: (code: number | null) => void | Promise<void> } = {},
): Response {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  const generator = makeGenerator(abortController.signal);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(evt: RunnerEvent) {
        controller.enqueue(
          encoder.encode(`event: ${evt.kind}\ndata: ${JSON.stringify(evt)}\n\n`),
        );
      }
      try {
        for await (const evt of generator) {
          send(evt);
          if (evt.kind === "process_exit" && opts.onExit) {
            await opts.onExit(evt.code);
          }
        }
      } catch (err) {
        send({ kind: "raw", data: { stream_error: String(err) } });
      } finally {
        releaseLock();
        try {
          controller.close();
        } catch {
          // already closed by client disconnect — fine.
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
