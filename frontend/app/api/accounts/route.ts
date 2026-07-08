import type { NextRequest } from "next/server";
import { listAccounts, getActiveAccountId, addAccount, setActiveAccount } from "@/lib/accounts";
import { getLockStatus } from "@/lib/lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ active: getActiveAccountId(), accounts: listAccounts() });
}

export async function POST(request: NextRequest) {
  let body: { label?: string; repoPath?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const label = (body.label ?? "").trim();
  const repoPath = (body.repoPath ?? "").trim();
  if (!label || !repoPath) {
    return Response.json({ error: "missing_label_or_repoPath" }, { status: 400 });
  }

  const result = addAccount(label, repoPath);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ active: getActiveAccountId(), accounts: listAccounts() });
}

export async function PATCH(request: NextRequest) {
  const status = getLockStatus();
  if (status.busy) {
    return Response.json(
      { error: "busy", activeAction: status.activeAction },
      { status: 409 },
    );
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id) {
    return Response.json({ error: "missing_id" }, { status: 400 });
  }

  const result = setActiveAccount(body.id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  return Response.json({ active: getActiveAccountId(), accounts: listAccounts() });
}
