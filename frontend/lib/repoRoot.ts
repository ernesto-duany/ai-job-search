import { getActiveRepoRoot } from "./accounts";

/**
 * Every fs read/write and every `claude` subprocess spawn must resolve
 * against the OUTER ai-job-search repo, not this Next.js app's own cwd —
 * and, with multi-account support, against whichever account's repo is
 * currently active, not always the same one. Centralized here so nothing
 * else has to re-derive it. Delegates to lib/accounts.ts, which bootstraps
 * a single default account (today's parent-directory behavior) the first
 * time it's read, so existing single-account setups are unaffected until a
 * second account is actually registered.
 */
export function getRepoRoot(): string {
  return getActiveRepoRoot();
}
