import { getLockStatus } from "@/lib/lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getLockStatus());
}
