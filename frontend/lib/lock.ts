import fs from "node:fs";
import path from "node:path";

/**
 * File-based lock so only one `claude` subprocess runs at a time. A plain
 * in-memory module variable is NOT reliable here because Next.js dev-server
 * fast refresh / route isolation can reload this module; a file survives
 * that. The lock's `pid` is THIS Node server process's own pid (not the
 * spawned claude child's) — that's what lets a stale lock self-heal if the
 * dev server crashed or restarted: `process.kill(oldPid, 0)` throws ESRCH
 * once the old server process is gone, and a fresh acquire proceeds.
 *
 * The lock is held only while a claude child process is actively running
 * between spawn and exit. A session that finished a turn and is waiting on
 * the user's next reply holds no lock — multiple sessions can sit "paused"
 * simultaneously, only one can be mid-turn.
 */

interface LockData {
  pid: number;
  actionId: string;
  startedAt: string;
}

function lockDir(): string {
  // Lives under frontend/, not the outer repo — this is UI-runtime state,
  // not repo data.
  return path.join(process.cwd(), ".data");
}

function lockPath(): string {
  return path.join(lockDir(), "runner.lock.json");
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLockSync(): LockData | null {
  try {
    const raw = fs.readFileSync(lockPath(), "utf8");
    return JSON.parse(raw) as LockData;
  } catch {
    return null;
  }
}

export type AcquireResult =
  | { ok: true }
  | { ok: false; activeAction: string; startedAt: string };

export function acquireLock(actionId: string): AcquireResult {
  fs.mkdirSync(lockDir(), { recursive: true });

  const existing = readLockSync();
  if (existing && isAlive(existing.pid)) {
    return { ok: false, activeAction: existing.actionId, startedAt: existing.startedAt };
  }

  const data: LockData = {
    pid: process.pid,
    actionId,
    startedAt: new Date().toISOString(),
  };
  fs.writeFileSync(lockPath(), JSON.stringify(data), "utf8");
  return { ok: true };
}

export function releaseLock(): void {
  const existing = readLockSync();
  if (existing && existing.pid === process.pid) {
    try {
      fs.unlinkSync(lockPath());
    } catch {
      // already gone — fine.
    }
  }
}

export interface LockStatus {
  busy: boolean;
  activeAction?: string;
  startedAt?: string;
}

export function getLockStatus(): LockStatus {
  const existing = readLockSync();
  if (existing && isAlive(existing.pid)) {
    return { busy: true, activeAction: existing.actionId, startedAt: existing.startedAt };
  }
  return { busy: false };
}
