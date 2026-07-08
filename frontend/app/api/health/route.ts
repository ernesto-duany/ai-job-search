import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckResult {
  ok: boolean;
  detail: string;
}

async function checkCommand(cmd: string): Promise<CheckResult> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 5000 });
    return { ok: true, detail: stdout.trim().split("\n")[0] };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const [claude, lualatex, xelatex, bun] = await Promise.all([
    checkCommand("claude --version"),
    checkCommand("lualatex --version"),
    checkCommand("xelatex --version"),
    checkCommand("bun --version"),
  ]);

  return Response.json({
    claude,
    lualatex,
    xelatex,
    bun,
    // No lightweight way to verify Claude Code is actually authenticated
    // without spending a real turn — this is a known gap, not an oversight.
    // The workspace-trust prerequisite (see README) is also not checked
    // here for the same reason.
    note: "Binary presence only. Run any action to confirm auth + workspace trust.",
  });
}
