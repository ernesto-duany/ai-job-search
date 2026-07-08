import path from "node:path";

/**
 * Every fs read/write and every `claude` subprocess spawn must resolve
 * against the OUTER ai-job-search repo, not this Next.js app's own cwd.
 * Centralized here so nothing else has to re-derive it.
 */
export function getRepoRoot(): string {
  const override = process.env.AI_JOB_SEARCH_REPO_ROOT;
  if (override) return path.resolve(override);
  // frontend/ is a direct child of the repo root.
  return path.resolve(process.cwd(), "..");
}
