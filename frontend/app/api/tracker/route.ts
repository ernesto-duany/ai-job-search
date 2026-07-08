import type { NextRequest } from "next/server";
import { loadAndMigrateTracker, updateTrackerJobUrl } from "@/lib/tracker";
import { getLockStatus } from "@/lib/lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await loadAndMigrateTracker();
  return Response.json({ rows });
}

export async function PATCH(request: NextRequest) {
  const status = getLockStatus();
  if (status.busy) {
    return Response.json(
      { error: "busy", activeAction: status.activeAction },
      { status: 409 },
    );
  }

  let body: { index?: number; jobUrl?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.index !== "number" || typeof body.jobUrl !== "string") {
    return Response.json({ error: "missing_index_or_jobUrl" }, { status: 400 });
  }

  try {
    await updateTrackerJobUrl(body.index, body.jobUrl);
  } catch (err) {
    return Response.json(
      { error: "update_failed", message: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const rows = await loadAndMigrateTracker();
  return Response.json({ rows });
}
