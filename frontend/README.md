# Job Search Assistant — local frontend

A local web dashboard for the `ai-job-search` Claude Code workflow. It gives every skill
(`/scrape`, `/apply`, `/upskill`, `/expand`, `/add-template`, `/add-portal`, `/reset`) a dedicated
card, plus a structured Profile form and an Applications tracker table.

**Claude does all the thinking.** Every action button spawns a real `claude -p` session against
the outer repo — the same `CLAUDE.md`, skills, and verification workflows you already use apply.
This frontend is a UI on top of that, not a reimplementation of it.

## Prerequisites

1. [Claude Code CLI](https://code.claude.com) installed and logged in (`claude --version` should work).
2. **Run `claude` once, interactively, in the repo root, and accept the workspace-trust prompt.**
   This is a one-time, separate step from anything below — without it, every action run through
   this dashboard will silently ignore the permission allowlist in `.claude/settings.json` and
   most actions will fail. (Claude Code shows a warning in its own output the first time this
   happens: *"this workspace has not been trusted."*)
3. [Bun](https://bun.sh) installed (`bun --version`).
4. A LaTeX distribution with `lualatex` and `xelatex` on `PATH` (needed for `/apply`'s CV/cover
   letter compile step) — see the repo's own `SETUP.md` for install instructions.

The dashboard's home page shows a banner if any of these are missing.

## Running it

```bash
cd frontend
bun install
bun run dev
```

Opens on `http://127.0.0.1:3000` — **bound to localhost only**, not `0.0.0.0`. This is load-bearing,
not cosmetic: the API routes here can write repo files and spawn `claude` subprocesses with no
authentication layer, so binding to localhost is the actual security boundary. Don't put this
behind a reverse proxy or expose the port externally.

No login/auth is needed beyond that binding — this is a single-local-user tool.

## How it works

- `lib/claudeRunner.ts` spawns `claude -p "<prompt>" --output-format stream-json` (or `--resume
  <session-id>` for follow-up turns) from the outer repo root, parses the NDJSON event stream, and
  yields normalized events.
- `app/api/skill-runner/{start,reply,status}` wraps that in Server-Sent Events so the browser can
  watch a run live, and enforces a file-based lock (`.data/runner.lock.json`) so only one `claude`
  subprocess runs at a time.
- Every action (Find New Jobs, Get Ready for a Job, Skill Gap Check, Expand Profile, Add Template,
  Add Portal, Reset Data) shares one `ChatRunner` UI component and one backend primitive — the only
  difference between them is their pre-form fields and the initial prompt they send. If a command
  needs to ask a follow-up question (e.g. `/apply`'s "Should I proceed?" or `/reset`'s "type
  RESET"), that just shows up as the next chat turn with a reply box — there's no special-casing.
- `/profile` reads and writes `CLAUDE.md` and `.claude/skills/job-application-assistant/
  01-candidate-profile.md` directly (no Claude subprocess). These two files aren't exact mirrors of
  each other in this repo — see the comment at the top of `lib/profileParser.ts` for exactly which
  file is authoritative for which section, and what a save does to keep them in sync.
- `/applications` reads `job_search_tracker.csv` (via `lib/tracker.ts`), migrating in a `job_url` /
  `job_url_source` column pair on first load and fuzzy-matching existing rows against
  `job_scraper/seen_jobs.json` to backfill real links where possible. Rows tagged "auto" were
  guessed this way — verify before trusting them. Going forward, `/apply` (see its Step 7) writes
  the URL itself when you start a run from this dashboard.

## Known gaps

- No lightweight way to check "is Claude actually authenticated" without spending a real API turn
  — `/api/health` only checks that the `claude` binary exists, not that it's logged in.
- `/expand`, `/add-template`, and `/add-portal` are genuinely interview-style commands. The chat
  UI handles this fine (just keep replying), but there's no special guidance layer beyond what the
  command itself already asks.
