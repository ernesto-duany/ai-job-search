import fs from "node:fs";
import path from "node:path";

/**
 * Multi-account support: each account is a completely separate clone of
 * the outer ai-job-search repo (own CLAUDE.md, own profile, own tracker,
 * own cv/cover_letters, own everything) — not a nested multi-tenant data
 * model. This registry just remembers where each account's repo lives on
 * disk and which one is currently active; every other lib module keeps
 * reading/writing exactly one repo root per request, same as before
 * multi-account support existed.
 *
 * Lives in frontend/.data/ (gitignored, machine-local) — this is UI
 * runtime state, not data that belongs in any account's own repo.
 */

export interface AccountEntry {
  id: string;
  label: string;
  repoPath: string;
}

interface AccountsConfig {
  active: string;
  accounts: Record<string, AccountEntry>;
}

function configPath(): string {
  return path.join(process.cwd(), ".data", "accounts.json");
}

function defaultRepoRoot(): string {
  const override = process.env.AI_JOB_SEARCH_REPO_ROOT;
  if (override) return path.resolve(override);
  // frontend/ is a direct child of the repo root.
  return path.resolve(process.cwd(), "..");
}

/**
 * Bootstraps a single "primary" account pointing at today's default repo
 * root the first time this is called — existing single-account installs
 * see zero behavior change until a second account is actually registered.
 */
function readConfig(): AccountsConfig {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw) as AccountsConfig;
    if (parsed.active && parsed.accounts && parsed.accounts[parsed.active]) {
      return parsed;
    }
  } catch {
    // fall through to bootstrap
  }
  const bootstrapped: AccountsConfig = {
    active: "primary",
    accounts: {
      primary: { id: "primary", label: "Primary", repoPath: defaultRepoRoot() },
    },
  };
  writeConfig(bootstrapped);
  return bootstrapped;
}

function writeConfig(config: AccountsConfig): void {
  const dir = path.dirname(configPath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), "utf8");
}

export function listAccounts(): AccountEntry[] {
  return Object.values(readConfig().accounts);
}

export function getActiveAccountId(): string {
  return readConfig().active;
}

export function getActiveAccount(): AccountEntry {
  const config = readConfig();
  return config.accounts[config.active];
}

export function getActiveRepoRoot(): string {
  // Explicit env override always wins — scripts/tests rely on this taking
  // precedence over whatever account happens to be active.
  const override = process.env.AI_JOB_SEARCH_REPO_ROOT;
  if (override) return path.resolve(override);
  return getActiveAccount().repoPath;
}

function slugify(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "account";
}

export interface AddAccountResult {
  ok: true;
  account: AccountEntry;
}
export interface AddAccountError {
  ok: false;
  error: string;
}

/**
 * Registers a new account pointing at an existing local directory. Requires
 * a CLAUDE.md there already — that's the one sanity check that this is
 * actually an ai-job-search repo and not an arbitrary/empty path, since
 * every other module assumes CLAUDE.md exists.
 */
export function addAccount(label: string, repoPath: string): AddAccountResult | AddAccountError {
  const resolved = path.resolve(repoPath);
  if (!fs.existsSync(path.join(resolved, "CLAUDE.md"))) {
    return {
      ok: false,
      error: `No CLAUDE.md found at ${resolved}. Clone the repo there and run /setup first.`,
    };
  }

  const config = readConfig();
  let id = slugify(label);
  let suffix = 2;
  while (config.accounts[id]) {
    id = `${slugify(label)}-${suffix}`;
    suffix += 1;
  }

  const account: AccountEntry = { id, label, repoPath: resolved };
  config.accounts[id] = account;
  writeConfig(config);
  return { ok: true, account };
}

export function setActiveAccount(id: string): { ok: boolean; error?: string } {
  const config = readConfig();
  if (!config.accounts[id]) {
    return { ok: false, error: `Unknown account: ${id}` };
  }
  config.active = id;
  writeConfig(config);
  return { ok: true };
}
