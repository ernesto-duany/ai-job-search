// Native EventSource is GET-only and can't carry a JSON body, so the
// skill-runner endpoints are POST + a hand-parsed text/event-stream body
// read via fetch's ReadableStream instead.

export interface SSEMessage {
  event: string;
  data: unknown;
}

export async function* readSSEStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<SSEMessage> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        const dataStr = dataLines.join("\n");
        let data: unknown = dataStr;
        try {
          data = JSON.parse(dataStr);
        } catch {
          // leave as raw string — better than dropping the event.
        }
        yield { event: eventName, data };
      }
    }
  } finally {
    reader.releaseLock();
  }
}
