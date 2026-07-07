# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Search Sites

Primary (US market):
- **linkedin.com/jobs** - LinkedIn job listings
- **indeed.com** - largest general US job board
- Company ATS boards via Google `site:` search - **boards.greenhouse.io**, **jobs.lever.co**, **jobs.ashbyhq.com** (common for AI-native / startup employers)

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies, plus general (no `site:` filter) searches for niche titles like "Forward Deployed Engineer"

<!-- TODO (reminder requested by candidate 2026-07-07): once this WebSearch-based baseline is working, run /add-portal to wire up a dedicated CLI tool for Indeed and/or a Central Florida-specific job board. -->

## Query Categories

Queries are grouped by priority. Each query should be combined with your location terms (Lake Mary FL, Orlando FL, Central Florida, or Remote) where the site supports it.

### Priority 1: AI Solutions Architect / Forward Deployed AI Engineer

These match your strongest and most desired career direction.

```
site:linkedin.com/jobs "Forward Deployed Engineer" (Orlando OR Remote)
site:linkedin.com/jobs "AI Solutions Architect" Florida
site:indeed.com "Forward Deployed AI Engineer" Remote
"AI native engineer" Orlando OR Remote
```

### Priority 2: AI Agents, LLMs & Intelligent Automation

These match your domain expertise.

```
site:linkedin.com/jobs "AI Engineer" LLM agents Orlando OR Remote
site:linkedin.com/jobs "Applied AI Engineer" Remote
site:indeed.com "AI automation" architect Florida
```

### Priority 3: Product Owner / AI Enablement Lead

Adjacent roles you could pivot into, leveraging your BNY Mellon product-ownership and AI-enablement background.

```
site:linkedin.com/jobs "AI Product Owner" Florida OR Remote
site:linkedin.com/jobs "AI Enablement Lead" Remote
site:linkedin.com/jobs "Technical Product Manager" AI Florida
```

### Priority 4: Broader Full-Stack / Solutions Architect

Wider net for general technical roles.

```
site:linkedin.com/jobs "Solutions Architect" Next.js OR React Florida OR Remote
site:indeed.com "Full-Stack Developer" Next.js Orlando
site:boards.greenhouse.io "Forward Deployed" Engineer
```

## Location Filter

When evaluating results, verify the job location is within reasonable commute distance from Lake Mary, FL (32746), or is fully remote. Define acceptable areas:
- Lake Mary, FL and immediately surrounding areas (Sanford, Heathrow, Longwood) - ideal
- Orlando metro, up to ~40 miles from 32746 (Winter Park, Altamonte Springs, Maitland, downtown Orlando) - acceptable, hybrid OK
- Central Florida beyond 40 miles (Tampa, Daytona) - borderline, only if hybrid days are limited (1-2/week) or the role is exceptional
- Fully remote (any US location) - acceptable regardless of distance
- Roles requiring full relocation, or on-site outside the above radius with no remote option - too far

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape [focus_area]" -> relevant category queries + custom focus-specific queries

## Portal Expansion (TODO - reminder requested by candidate)

The Danish CLI tools shipped in `.agents/skills/` (jobbank, jobdanmark, jobindex, jobnet) are not relevant for a US-based search and can be ignored. `linkedin-search` in the same folder IS country-agnostic and can be installed later (`cd .agents/skills/linkedin-search/cli && bun install`) for structured LinkedIn queries instead of relying on WebSearch alone.

Next step when ready: run `/add-portal` to generate a dedicated CLI skill for Indeed and/or a Central Florida job board, the same way the Danish tools were built.
