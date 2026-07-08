# Job Application Assistant for Ernesto Duany

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Ernesto Duany, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

<!-- This section is auto-populated by /setup. You can also fill it in manually. -->

### Identity
- **Name:** Ernesto Duany
- **Location:** Lake Mary, FL, USA (Hybrid; open to roles within ~40 miles of 32746, or fully remote)
- **Languages:** English, Spanish
- **Status:** Employed full-time (BNY Mellon), concurrently running OpSight USA as Founder
- **LinkedIn headline:** "AI Solutions Architect | Product Owner | Full-Stack Development"

### Education
- **B.S. in Computer Science** (In Progress) - University of Central Florida
- **A.S. in Computer Science** - Valencia College
- **Digital Business Accelerator, Project Manager track** (Oct 2023-Oct 2024) - Multiverse

### Professional Experience
- **Founder | AI Solutions Architect & Product Owner** (Jan 2026 - Present) - **OpSight USA** (Lake Mary, FL, Self-Employed)
  - Architecting OSx, a multi-tenant SaaS platform (Next.js, Supabase/Postgres: 15 modules, 113 tables, approx. 104K LOC) with 6 Claude-powered AI capabilities served over a Model Context Protocol (MCP) server, every query scoped to the user's RLS-scoped database client
  - Designed an "AI suggests, humans decide" governance model for OSx: zero AI write paths, database-level guards over 8 protected legal clause types, a risk-tier gate on financial/outbound actions, and 861 automated tests including a live-database CI suite proving cross-tenant denial
  - Built and shipped Sequoyah Careers, a healthcare staffing platform with a dynamic job-listing system and an application form integrated with Resend
  - Lead discovery workshops with stakeholders, translating business requirements into technical blueprints and roadmaps
- **Operations Program Lead** - Training, AI Enablement, Product Owner & Risk Oversight (Sep 2024 - Present) - **BNY Mellon**
  - Lead a team of 30 operators, owning performance, training, and workflow improvements
  - Designed and built a training platform from scratch, standardizing onboarding
  - Product Owner for an enterprise AI agent rollout, reducing research time by up to 40%
  - Designed intelligent automation workflows using Microsoft Power Platform / Power Automate
- **Senior OFAC / AML Sanctions Review Operator, Level 4** (Oct 2023 - Sep 2024) - **BNY Mellon**
  - Led OFAC sanctions screening on high-risk entities/jurisdictions; conducted EDD per BSA/AML requirements
  - Contributed to process improvements that reduced false-positive rates
- **Senior Business Systems Architect | AI Solutions Architect** (Jan 2020 - Mar 2026) - **Milenium Computer Services, Inc.** (Freelance, Remote)
  - Primary client-facing liaison; led discovery sessions to automate manual processes
  - Architected enterprise systems and digital transformation initiatives; built and delivered full-stack applications
- **Full-Stack Developer Intern** (Jan 2017 - Jan 2020) - **Milenium Computer Services, Inc.** (Internship, Remote)
  - Developed full-stack features across frontend and backend, building foundational web development experience
- **Technical Support Specialist** (Apr 2023 - Oct 2023) - **Apple**
  - Resolved hardware/software issues; maintained documentation for consistent resolutions

### Technical Skills
- **Primary:** AI Solution Architecture, LLM Application Engineering (Claude API, Model Context Protocol servers), Multi-Tenant SaaS Architecture, Database/Row-Level Security (RLS) Design, Next.js/React/Node.js Full-Stack Development
- **Secondary:** Prompt Engineering, Microsoft Power Automate/Power Apps, Copilot Studio, AI Builder, REST API Design, Zod schema validation, CI/CD & automated testing at scale, Git/GitHub
- **Domain:** Financial services & regulated compliance (OFAC/AML/BSA), AI governance & responsible-AI design, digital transformation, product ownership, enterprise/solution architecture
- **Software:** Next.js, React, Node.js, Supabase/PostgreSQL, JavaScript, TypeScript, HTML/CSS, Vercel, Resend, Git/GitHub, Microsoft Power Platform, Copilot Studio, AI Builder, Anthropic Claude API, Claude Code (AI-assisted development)

### Certifications
- **Certified in Cybersecurity (CC)** - (ISC)²
- **Front-End Web Development** - Udacity
- **Apple Technical Support Specialist**

### Publications
None currently.

### Awards
None currently.

### Behavioral Profile
<!-- Source: Predictive Index-style behavioral assessment provided by candidate -->
- **Goal-Oriented & Conscientious** - Strong drive to achieve with excellent follow-through; self-disciplined, organized, detail-oriented
- **Extroverted & Cooperative** - Sociable and energetic; values harmony and fair treatment; highly coachable
- **Competitive & Motivated** - Strong inner drive, thrives on performance measurement, comfortable taking calculated risks
- **Strengths:** Achievement drive, follow-through, conscientiousness, competitiveness, calm under pressure, self-confidence, team collaboration
- **Growth areas:** Not yet assessed - the source assessment covered strengths only; update after a 360 review or further self-reflection
- **Thrives in:** Fast-paced, goal-driven environments with clear performance measurement, stakeholder interaction, and room for calculated risk-taking; collaborative, service-oriented team culture

### What Excites You
<!-- Inferred from career-direction answer and resume evidence - confirm/adjust -->
- Building and deploying AI agents / intelligent automation systems hands-on, close to the end user (forward-deployed style work)
- Owning a solution end-to-end, from discovery through architecture to shipped product

### Target Sectors
<!-- Suggested based on stated career direction - not yet confirmed by candidate -->
- AI / Applied AI: companies hiring for Forward Deployed Engineer / AI-native engineer roles (e.g. Anthropic, OpenAI, Palantir, Scale AI - suggested examples)
- Financial services & regulated tech: institutions running AI transformation programs (familiar territory from BNY Mellon)

### Deal-breakers
- Base salary below $100k
- Contract-only positions are accepted but not preferred - full-time roles preferred

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`
