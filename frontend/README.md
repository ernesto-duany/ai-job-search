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

### Opening it from your phone (same WiFi)

Use `bun run dev:lan` instead of `bun run dev`. This binds to `0.0.0.0` instead of `127.0.0.1`, so
the dashboard also accepts connections from other devices on your home network — not just your own
computer.

1. Start it: `bun run dev:lan` (or `bun run build && bun run start:lan` for the production build).
2. Find your computer's LAN IP address:
   - **macOS**: System Settings → Wi-Fi → Details (or `ipconfig getifaddr en0` in Terminal)
   - **Windows**: `ipconfig` in Command Prompt, look for "IPv4 Address" under your WiFi adapter
   - **Linux**: `ip addr show` or `hostname -I`
   - It'll look like `192.168.x.x` or `10.0.x.x`.
3. On your phone (connected to the **same WiFi network**), open `http://<that-IP>:3000`.

This is real exposure, scoped to your home network: **any device on that WiFi can reach the
dashboard and use its full capabilities** — writing repo files, spawning Claude sessions, editing
your profile — with no login. That's a reasonable tradeoff on a trusted home network, but don't
run `dev:lan` on shared/public WiFi (coffee shops, coworking spaces, hotels), and switch back to
plain `bun run dev` when you're not actively using it from your phone.

If you ever want this reachable from *outside* your home network (e.g. via Tailscale or ngrok),
add at least a basic password gate first — there isn't one today, and internet-wide exposure with
zero auth on a subprocess-spawning, file-writing backend is a materially different risk than a
home LAN.

## Multiple accounts (e.g. a spouse's own job search)

Each account is a **completely separate clone of the outer `ai-job-search` repo** — its own
`CLAUDE.md`, its own profile, its own tracker, its own `cv/`/`cover_letters/`, its own everything.
This one running frontend just remembers which account's repo directory is currently active and
points every action at it. There's no nested multi-tenant data model and no password — the account
switcher in the top-right of the dashboard is a plain dropdown, matching this tool's existing
"local, no-auth" design.

**To add someone else:**

1. Clone this repo again, somewhere else on the same machine (or their own machine, if they'll run
   their own frontend instance): `git clone <repo-url> ~/ai-job-search-<their-name>`.
2. In that new clone, run `claude` and `/setup` to onboard *their* profile — this is the same
   onboarding flow you used for your own profile, untouched.
3. Back in this dashboard, click **+ Add account** (top-right), give it a display name, and point
   it at that clone's absolute path. It needs a `CLAUDE.md` there already, so do step 2 first.
4. Switch between accounts with the dropdown. Whichever is active is what every button on the
   dashboard operates on — Applications, Profile, and every action's Claude session all read and
   write that account's repo, not the other one.

A few things worth knowing:
- Switching accounts triggers a full page reload so every page re-fetches the newly active
  account's data — don't be surprised by the flash.
- You can't switch accounts while a run is in progress (you'll get a "busy" error) — this avoids a
  Claude session started under one account finishing its writes against the other.
- There's currently no way to remove an account from the switcher through the UI — edit
  `frontend/.data/accounts.json` directly if you need to (it's just `{active, accounts: {id:
  {label, repoPath}}}`).
- The lock that keeps only one Claude subprocess running at a time is global across all accounts,
  not per-account — so two accounts' runs still queue behind each other, they don't run
  concurrently. Fine for a switcher used by one person at a time; if you want true simultaneous use
  from two devices, that lock would need to become per-account.

## How it works

- `lib/accounts.ts` resolves which account's repo is currently active
  (`frontend/.data/accounts.json`); `lib/repoRoot.ts` — used everywhere else — just delegates to
  it, so every other module below picks up the active account automatically.
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
