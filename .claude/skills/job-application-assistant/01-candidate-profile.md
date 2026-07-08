# Candidate Profile

## Identity
- **Name:** Ernesto Duany
- **Location:** Lake Mary, FL, USA
- **Phone:** Not provided yet - add when available
- **Email:** alejandrodc1732@gmail.com
- **LinkedIn:** https://linkedin.com/in/ernesto-duanyyy
- **Portfolio:** https://ernesto-duany.github.io
- **Languages:** English, Spanish
- **Status:** Employed full-time (BNY Mellon), concurrently running OpSight USA as Founder
- **Constraints:** Hybrid preferred; open to roles within ~40 miles of 32746 (Lake Mary, FL) or fully remote

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| B.S. Computer Science (In Progress) | - | University of Central Florida | Computer science fundamentals |
| A.S. Computer Science | - | Valencia College | Computer science fundamentals |
| Digital Business Accelerator (Project Manager track) | Oct 2023 - Oct 2024 | Multiverse | Project management, digital business |

## Professional Experience

### Founder | AI Solutions Architect & Product Owner - OpSight USA (Jan 2026 - Present)
Lake Mary, FL (Self-Employed)

**OSx** (multi-tenant SaaS platform, in development):
- Architected the AI layer of a multi-tenant SaaS platform (Next.js, Supabase/Postgres: 15 modules, 113 tables, approx. 104K LOC): 6 Claude-powered capabilities and 11 permission-scoped tools served over a Model Context Protocol (MCP) server, where every query executes as the user's RLS-scoped database client, making cross-tenant data leakage structurally impossible
- Designed an "AI suggests, humans decide" governance model with zero AI write paths: database-level guards over 8 protected legal clause types, a risk-tier gate routing all financial/outbound actions to human confirmation, and sanitized tool errors, eliminating hallucinated-write and prompt-injection risk classes by construction
- Built document-native extraction pipelines (PDF to Claude at temperature 0, Zod-validated schemas) powering an email-to-payment accounts-payable flow with two human approval gates, plus per-tenant bring-your-own-key infrastructure (AES-256-GCM) with metered quotas across 4 pricing tiers and prompt caching designed to cut repeat-context inference cost by up to approximately 90% (estimated)
- Enforced tenant isolation as a hard merge gate: 499 authorization-re-checking Postgres RPCs, 159 default-deny RLS policies, and 861 automated tests, including a live-database CI suite proving cross-tenant denial, plus deterministic keyless stubs so CI and dev run the full AI product at zero API spend
- Sole owner of end-to-end delivery across 24+ sequential release phases and 129 database migrations, running a plan-review-build-validate-document cycle

**Sequoyah Careers** (healthcare staffing platform, shipped):
- Built and shipped Sequoyah Careers, a healthcare staffing platform with a dynamic job-listing system and an end-to-end application form integrated with Resend for transactional email delivery

General:
- Lead discovery workshops with stakeholders, gathering business requirements and translating them into technical solution blueprints, product roadmaps, and implementation strategies
- Drive product adoption by delivering user guides, documentation, and hands-on enablement, incorporating client feedback into iterative product improvements
- Own product development end to end - from system design and architecture decisions through implementation, release, and post-launch adoption
- Tools: Next.js, React, Node.js, TypeScript, Supabase/PostgreSQL, Zod, Anthropic Claude API, Model Context Protocol (MCP), JavaScript, HTML/CSS, Vercel, Resend, Git/GitHub, Three.js/WebGL, AI-assisted development (Claude Code)

### Operations Program Lead | Training, AI Enablement, Product Owner & Risk Oversight - BNY Mellon (Sep 2024 - Present)
- Lead a team of 30 operators, owning day-to-day performance, training, and workflow improvements across the department
- Designed and built a training platform from scratch, introducing new tooling where none existed, to standardize onboarding, raise quality, and accelerate adoption of new processes
- Served as Product Owner for an enterprise AI agent rollout, driving AI adoption, user enablement, stakeholder alignment, and operational transformation while reducing research time by up to 40%
- Designed intelligent automation workflows using Microsoft Power Platform, Power Automate, and AI services to streamline business processes and improve operational efficiency
- Partnered with senior leadership and risk stakeholders to align process improvements, manage expectations, and drive consensus on operational changes
- Tools: Microsoft Power Platform (Power Automate, Power Apps), Copilot Studio, AI Builder, AI agents

### Senior OFAC / AML Sanctions Review Operator, Level 4 - BNY Mellon (Oct 2023 - Sep 2024)
- Analyzed transactional data within high-risk workflows and led OFAC sanctions screening on high-risk entities and jurisdictions
- Conducted enhanced due diligence (EDD) and investigated alerts in alignment with BSA/AML regulatory requirements
- Contributed to process improvements that enhanced screening efficiency and reduced false-positive rates

### Senior Business Systems Architect | AI Solutions Architect - Milenium Computer Services, Inc. (Jan 2020 - Mar 2026)
Remote (Freelance)
- Served as primary client-facing liaison, leading discovery sessions with operations and compliance stakeholders to identify manual processes and design system-based solutions to automate them
- Architected enterprise systems, AI-enabled solutions, and digital transformation initiatives by translating business requirements into scalable technical architectures, integration strategies, and implementation roadmaps
- Built and delivered full-stack applications, handling software installation, configuration, and end-to-end implementation
- Partnered with clients and cross-functional teams to scope, plan, and deploy technology solutions, supporting adoption with documentation and guidance
- Tools: JavaScript, HTML/CSS, Next.js, React, full-stack web development, Git/GitHub

### Full-Stack Developer Intern - Milenium Computer Services, Inc. (Jan 2017 - Jan 2020)
Remote (Internship)
- Developed full-stack features across frontend and backend, building foundational web development experience with modern frameworks and development workflows

### Technical Support Specialist - Apple (Apr 2023 - Oct 2023)
- Resolved hardware and software issues for a wide range of users and maintained detailed documentation supporting consistent, high-quality resolutions

## Independent Projects
- **Sequoyah Careers**: Healthcare staffing platform built at OpSight USA - dynamic job-listing system with an end-to-end application form integrated with Resend for transactional email delivery. Built with Next.js, React, Node.js.

## Technical Skills

### Programming & AI
- **JavaScript/TypeScript** (proficient): Next.js (App Router), React, Node.js, HTML/CSS, REST APIs
- **LLM Application Engineering**: Anthropic Claude API integration, Model Context Protocol (MCP) servers, permission-scoped tool design, document-native extraction pipelines (PDF to LLM, Zod-validated schemas), prompt caching, AI Agents, Prompt Engineering
- **Database & Security Architecture**: Supabase/PostgreSQL, Row-Level Security (RLS) policy design, multi-tenant data isolation, authorization-re-checking RPCs, AES-256-GCM encryption
- **AI Governance**: Human-in-the-loop approval gates, risk-tier action routing, hallucinated-write and prompt-injection risk mitigation by design
- **Low-code/Automation platforms**: Microsoft Power Automate, Power Apps, Copilot Studio, AI Builder
- **Testing & CI/CD**: Automated test suites at scale (800+ tests), live-database CI verification, deterministic keyless test stubs
- AI-assisted development: Claude Code

### Domain Expertise
- Solution / Enterprise / Systems / Technical / Application Architecture, Systems Integration, Solution Blueprinting, Technical Roadmapping
- Multi-Tenant SaaS Architecture, AI Product Monetization (usage-metered pricing tiers, bring-your-own-key infrastructure)
- Product Ownership, Product Strategy, Requirements Gathering, Stakeholder Management, Team Leadership, Digital Transformation, Change Management
- Risk & Compliance: OFAC Sanctions Screening, AML Investigations, BSA/AML Compliance, Transaction Monitoring, Enhanced Due Diligence (EDD)

### Software & Tools
Next.js, React, Node.js, TypeScript, Supabase/PostgreSQL, Zod, Anthropic Claude API, Model Context Protocol (MCP), JavaScript, HTML/CSS, Vercel, Resend, Git/GitHub, Microsoft Power Platform, Copilot Studio, AI Builder, Three.js/WebGL

## Publications
None currently.

## Awards
None currently.

## References
None listed yet - add when available.

More references available upon request.
