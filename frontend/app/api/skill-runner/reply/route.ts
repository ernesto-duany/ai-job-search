import type { NextRequest } from "next/server";
import { acquireLock } from "@/lib/lock";
import { runClaudeTurn } from "@/lib/claudeRunner";
import { createSSEResponse } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { sessionId?: string; message?: string; actionId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  const message = body.message;
  if (!sessionId || !message) {
    return Response.json({ error: "missing_sessionId_or_message" }, { status: 400 });
  }

  // Reply-box turns aren't tied to a specific action's pre-form, but the
  // lock still needs a label for the busy banner — fall back to a generic one.
  const lockLabel = body.actionId ?? "reply";
  const lockResult = acquireLock(lockLabel);
  if (!lockResult.ok) {
    return Response.json(
      { error: "busy", activeAction: lockResult.activeAction, startedAt: lockResult.startedAt },
      { status: 409 },
    );
  }

  return createSSEResponse((signal) =>
    runClaudeTurn({ prompt: message, resumeSessionId: sessionId, signal }),
  );
}
