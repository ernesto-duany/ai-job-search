import path from "node:path";
import fs from "node:fs/promises";
import { getRepoRoot } from "@/lib/repoRoot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["cv", "cover_letters"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; filename: string[] }> },
) {
  const { type, filename } = await params;

  if (!ALLOWED_TYPES.has(type)) {
    return new Response("Not found", { status: 404 });
  }

  const joined = filename.join("/");
  if (!joined.toLowerCase().endsWith(".pdf")) {
    return new Response("Not found", { status: 404 });
  }

  const baseDir = path.join(getRepoRoot(), type);
  const resolved = path.resolve(baseDir, joined);

  // Containment check: resolved path must stay inside baseDir even if
  // filename segments try to traverse out with "..".
  const relative = path.relative(baseDir, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return new Response("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(resolved);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${path.basename(resolved)}"`,
    },
  });
}
