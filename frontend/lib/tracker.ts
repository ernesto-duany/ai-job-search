import fs from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";
import { getRepoRoot } from "./repoRoot";

/**
 * job_search_tracker.csv is the single source of truth Claude itself reads
 * and writes (via /apply, /upskill, and manual updates during a session).
 * This module only ever appends columns, never reorders or renames
 * existing ones — nothing here or in the skills parses the CSV
 * positionally, but staying append-only keeps diffs small and avoids
 * surprising a human editing the file directly.
 */

const TRACKER_COLUMNS = [
  "date",
  "company",
  "sector",
  "role",
  "role_type",
  "channel",
  "status",
  "contact_person",
  "fit_rating",
  "notes",
  "cv_file",
  "cover_letter_file",
  "source",
] as const;

const JOB_URL_COLUMN = "job_url";
const JOB_URL_SOURCE_COLUMN = "job_url_source"; // "manual" | "auto-matched" | ""

export interface TrackerRow {
  index: number;
  date: string;
  company: string;
  sector: string;
  role: string;
  role_type: string;
  channel: string;
  status: string;
  contact_person: string;
  fit_rating: string;
  notes: string;
  cv_file: string;
  cover_letter_file: string;
  source: string;
  job_url: string;
  job_url_source: string;
}

interface SeenJobEntry {
  title?: string;
  company?: string;
  url?: string;
}

function trackerPath(): string {
  return path.join(getRepoRoot(), "job_search_tracker.csv");
}

function seenJobsPath(): string {
  return path.join(getRepoRoot(), "job_scraper", "seen_jobs.json");
}

async function readRawCsv(): Promise<{ header: string[]; rows: Record<string, string>[] }> {
  let content: string;
  try {
    content = await fs.readFile(trackerPath(), "utf8");
  } catch {
    // No tracker yet — start from the canonical header, no rows.
    return { header: [...TRACKER_COLUMNS], rows: [] };
  }
  // Defensive normalization: force consistent LF line endings before
  // parsing, regardless of what wrote the file (this repo's own writes are
  // now consistent — see writeRawCsv — but a manual edit, a different tool,
  // or a Windows-side editor could reintroduce CRLF, and mixed newlines are
  // exactly what caused silent row loss before this was added).
  content = content.replace(/\r\n/g, "\n");
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  const header = parsed.meta.fields ?? [...TRACKER_COLUMNS];
  // PapaParse edge case (confirmed against papaparse@5.5.4): when the file's
  // last byte is the newline immediately after the last field's value (the
  // normal, well-formed case), that trailing "\n" gets absorbed into the
  // last row's last field instead of being treated as end-of-record. Strip
  // defensively rather than special-casing "last row, last column" — no
  // field in this schema is meant to carry meaningful leading/trailing
  // whitespace, so trimming every value is safe and also guards against
  // stray whitespace from manual edits.
  const rows = parsed.data.map((row) => {
    const trimmed: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      trimmed[key] = typeof value === "string" ? value.trim() : value;
    }
    return trimmed;
  });
  return { header, rows };
}

async function writeRawCsv(header: string[], rows: Record<string, string>[]): Promise<void> {
  // Papa.unparse defaults to "\r\n" between records but never adds a
  // trailing newline after the last one. Forcing newline: "\n" here AND
  // using the same "\n" for our own trailing terminator (below) keeps line
  // endings 100% consistent throughout the file. This matters more than it
  // sounds: a file with "\r\n" between records but a bare "\n" ending the
  // last one (the previous bug) makes Papa.parse — which sniffs the
  // newline style from the first rows — fail to recognize that bare "\n"
  // as a row terminator on the next read. It then silently merges the next
  // appended row into the previous row's overflow (__parsed_extra) and
  // drops it from the parsed result entirely. Confirmed via a live repro:
  // an appended row disappeared completely after one read-write cycle.
  const csv = Papa.unparse(
    { fields: header, data: rows.map((r) => header.map((h) => r[h] ?? "")) },
    { newline: "\n" },
  );
  await fs.writeFile(trackerPath(), csv + "\n", "utf8");
}

function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const shared = a.filter((w) => setB.has(w)).length;
  return shared / Math.max(a.length, b.length);
}

async function loadSeenJobs(): Promise<SeenJobEntry[]> {
  try {
    const raw = await fs.readFile(seenJobsPath(), "utf8");
    const data = JSON.parse(raw) as { seen?: Record<string, SeenJobEntry> };
    return Object.values(data.seen ?? {});
  } catch {
    return [];
  }
}

/**
 * Best-effort fuzzy match by company + role word overlap against
 * job_scraper/seen_jobs.json. Threshold and scoring mirror the style of
 * salary_lookup.py's company matcher (normalize, word-overlap, score
 * threshold) for consistency with the rest of the repo's tooling.
 * Never trusted silently — callers must persist job_url_source so the UI
 * can show a "verify" badge on auto-matched rows.
 */
function findBestMatch(
  row: { company: string; role: string },
  seenJobs: SeenJobEntry[],
): string | null {
  const rowCompany = normalizeWords(row.company);
  const rowRole = normalizeWords(row.role);
  let bestUrl: string | null = null;
  let bestScore = 0;
  for (const entry of seenJobs) {
    if (!entry.url) continue;
    const cScore = overlapScore(rowCompany, normalizeWords(entry.company ?? ""));
    const rScore = overlapScore(rowRole, normalizeWords(entry.title ?? ""));
    const combined = cScore * 0.5 + rScore * 0.5;
    if (combined > bestScore) {
      bestScore = combined;
      bestUrl = entry.url;
    }
  }
  return bestScore >= 0.4 ? bestUrl : null;
}

function ensureJobUrlColumns(
  header: string[],
  rows: Record<string, string>[],
): { header: string[]; changed: boolean } {
  let changed = false;
  const nextHeader = [...header];
  if (!nextHeader.includes(JOB_URL_COLUMN)) {
    nextHeader.push(JOB_URL_COLUMN);
    changed = true;
  }
  if (!nextHeader.includes(JOB_URL_SOURCE_COLUMN)) {
    nextHeader.push(JOB_URL_SOURCE_COLUMN);
    changed = true;
  }
  if (changed) {
    for (const row of rows) {
      row[JOB_URL_COLUMN] = row[JOB_URL_COLUMN] ?? "";
      row[JOB_URL_SOURCE_COLUMN] = row[JOB_URL_SOURCE_COLUMN] ?? "";
    }
  }
  return { header: nextHeader, changed };
}

async function backfillJobUrls(
  rows: Record<string, string>[],
): Promise<{ rows: Record<string, string>[]; changed: boolean }> {
  const candidates = rows.filter((r) => !(r[JOB_URL_COLUMN] ?? "").trim());
  if (candidates.length === 0) return { rows, changed: false };

  const seenJobs = await loadSeenJobs();
  if (seenJobs.length === 0) return { rows, changed: false };

  let changed = false;
  for (const row of rows) {
    if ((row[JOB_URL_COLUMN] ?? "").trim()) continue;
    const match = findBestMatch({ company: row.company ?? "", role: row.role ?? "" }, seenJobs);
    if (match) {
      row[JOB_URL_COLUMN] = match;
      row[JOB_URL_SOURCE_COLUMN] = "auto-matched";
      changed = true;
    }
  }
  return { rows, changed };
}

/**
 * Reads the tracker, migrating in the job_url/job_url_source columns and
 * fuzzy-backfilling missing URLs on first load. Idempotent — safe to call
 * on every request. Also used as the post-/apply reconciliation fallback
 * (see skill-runner start route): if apply.md's own tracker-write step
 * (Step 7) didn't populate job_url for some reason, this backfill pass
 * catches it on the next read.
 */
export async function loadAndMigrateTracker(): Promise<TrackerRow[]> {
  const { header, rows } = await readRawCsv();
  const colResult = ensureJobUrlColumns(header, rows);
  const backfillResult = await backfillJobUrls(rows);

  if (colResult.changed || backfillResult.changed) {
    await writeRawCsv(colResult.header, rows);
  }

  return rows.map((r, index) => ({
    index,
    date: r.date ?? "",
    company: r.company ?? "",
    sector: r.sector ?? "",
    role: r.role ?? "",
    role_type: r.role_type ?? "",
    channel: r.channel ?? "",
    status: r.status ?? "",
    contact_person: r.contact_person ?? "",
    fit_rating: r.fit_rating ?? "",
    notes: r.notes ?? "",
    cv_file: r.cv_file ?? "",
    cover_letter_file: r.cover_letter_file ?? "",
    source: r.source ?? "",
    job_url: r[JOB_URL_COLUMN] ?? "",
    job_url_source: r[JOB_URL_SOURCE_COLUMN] ?? "",
  }));
}

export async function updateTrackerJobUrl(rowIndex: number, jobUrl: string): Promise<void> {
  const { header, rows } = await readRawCsv();
  const colResult = ensureJobUrlColumns(header, rows);
  if (rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(`Row index ${rowIndex} out of range (${rows.length} rows)`);
  }
  rows[rowIndex][JOB_URL_COLUMN] = jobUrl;
  rows[rowIndex][JOB_URL_SOURCE_COLUMN] = "manual";
  await writeRawCsv(colResult.header, rows);
}

/**
 * Fallback safety net for the "Get Ready for a Job" action, called from the
 * skill-runner start route's onExit hook. apply.md's Step 7 is the primary
 * mechanism for writing job_url into the tracker row it creates — this only
 * fires if that step didn't happen (older apply.md version, the run was
 * stopped before drafting, or the model skipped it). Unlike the generic
 * fuzzy-match backfill in loadAndMigrateTracker, this has the actual URL
 * the user supplied when they started the run, so it doesn't need to guess:
 * it just finds the most recent row still missing a job_url and fills it in
 * directly. No-op if jobUrl is empty or every row already has one.
 */
export async function reconcileAfterApplyRun(jobUrl: string): Promise<void> {
  const trimmed = jobUrl.trim();
  if (!trimmed || trimmed === "none provided") return;

  const { header, rows } = await readRawCsv();
  const colResult = ensureJobUrlColumns(header, rows);

  let targetIndex = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (!(rows[i][JOB_URL_COLUMN] ?? "").trim()) {
      targetIndex = i;
      break;
    }
  }
  if (targetIndex === -1) return;

  rows[targetIndex][JOB_URL_COLUMN] = trimmed;
  rows[targetIndex][JOB_URL_SOURCE_COLUMN] = "auto-filled-by-frontend";
  await writeRawCsv(colResult.header, rows);
}
