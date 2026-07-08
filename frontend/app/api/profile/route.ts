import type { NextRequest } from "next/server";
import { loadCandidateProfile, saveCandidateProfile, type CandidateProfile } from "@/lib/profileParser";
import { getLockStatus } from "@/lib/lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await loadCandidateProfile();
  return Response.json({ profile });
}

export async function PUT(request: NextRequest) {
  const status = getLockStatus();
  if (status.busy) {
    // /expand or /setup could be mid-edit on the same profile files.
    return Response.json(
      { error: "busy", activeAction: status.activeAction },
      { status: 409 },
    );
  }

  let body: { profile?: CandidateProfile };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.profile) {
    return Response.json({ error: "missing_profile" }, { status: 400 });
  }

  try {
    await saveCandidateProfile(body.profile);
  } catch (err) {
    return Response.json(
      { error: "save_failed", message: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const profile = await loadCandidateProfile();
  return Response.json({ profile });
}
