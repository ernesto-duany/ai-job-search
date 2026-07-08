import type { NextRequest } from "next/server";
import { getAction, deriveApplyJobUrl } from "@/lib/actions";
import { acquireLock } from "@/lib/lock";
import { runClaudeTurn } from "@/lib/claudeRunner";
import { createSSEResponse } from "@/lib/sse";
import { reconcileAfterApplyRun } from "@/lib/tracker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { actionId?: string; input?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const actionId = body.actionId;
  if (!actionId) {
    return Response.json({ error: "missing_actionId" }, { status: 400 });
  }

  const action = getAction(actionId);
  if (!action) {
    return Response.json({ error: "unknown_action", actionId }, { status: 404 });
  }

  let prompt: string;
  try {
    prompt = action.buildInitialPrompt(body.input ?? {});
  } catch (err) {
    return Response.json(
      { error: "invalid_input", message: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const lockResult = acquireLock(actionId);
  if (!lockResult.ok) {
    return Response.json(
      { error: "busy", activeAction: lockResult.activeAction, startedAt: lockResult.startedAt },
      { status: 409 },
    );
  }

  const onExit =
    actionId === "apply"
      ? async () => {
          // apply.md Step 7 is the primary tracker-write mechanism; this is
          // just a fallback in case it didn't fire for some reason.
          const jobUrl = deriveApplyJobUrl(body.input ?? {});
          await reconcileAfterApplyRun(jobUrl);
        }
      : undefined;

  return createSSEResponse((signal) => runClaudeTurn({ prompt, signal }), { onExit });
}
