import fs from "node:fs/promises";
import path from "node:path";
import { getRepoRoot } from "./repoRoot";

/**
 * CLAUDE.md and 01-candidate-profile.md are NOT exact mirrors today (confirmed
 * by reading both in full): 01-candidate-profile.md has richer per-job detail
 * (a "Tools:" line, nested sub-projects like OSx/Sequoyah Careers within one
 * job entry) plus Independent Projects/References that CLAUDE.md lacks;
 * CLAUDE.md has Certifications/Behavioral Profile/What Excites You/Target
 * Sectors/Deal-breakers that 01-candidate-profile.md lacks. Rather than try
 * to losslessly round-trip both divergent shapes through one form, this
 * module treats 01-candidate-profile.md as primary for the sections both
 * files share (Identity, Education, Experience, Skills, Certifications,
 * Publications, Awards) and CLAUDE.md as the sole source for its
 * CLAUDE-only sections. Saves write the shared sections into BOTH files
 * (each reformatted to that file's own existing style) and the CLAUDE-only
 * sections into CLAUDE.md alone.
 *
 * Experience bullets are edited as one text block per job, not exploded
 * into per-bullet fields — 01-candidate-profile.md's OpSight entry nests
 * named sub-projects (OSx, Sequoyah Careers) inside one job's bullets, and
 * a naive flat bullet list editor risks silently flattening or losing that
 * structure. This is a deliberate scope decision, not an oversight.
 */

export interface EducationEntry {
  degree: string;
  period: string;
  institution: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  location: string;
  body: string; // raw markdown bullet block, edited as one unit
}

export interface CandidateProfile {
  identity: {
    name: string;
    location: string;
    phone: string;
    email: string;
    linkedin: string;
    portfolio: string;
    languages: string;
    status: string;
    constraints: string;
  };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  skills: {
    primary: string;
    secondary: string;
    domain: string;
    software: string;
  };
  certifications: string[];
  publications: string;
  awards: string;
  independentProjects: string;
  references: string;
  behavioralProfile: string[];
  whatExcitesYou: string[];
  targetSectors: string[];
  dealBreakers: string[];
}

function claudeMdPath(): string {
  return path.join(getRepoRoot(), "CLAUDE.md");
}

function candidateProfilePath(): string {
  return path.join(
    getRepoRoot(),
    ".claude",
    "skills",
    "job-application-assistant",
    "01-candidate-profile.md",
  );
}

/** Leading `<!-- ... -->` comment line of a section body, if any — these carry real provenance/confidence notes (e.g. "inferred, confirm/adjust") and must survive a save, not just the bullets. */
function extractLeadingComment(body: string | null): string | null {
  if (!body) return null;
  const firstLine = body.split("\n")[0]?.trim();
  return firstLine && firstLine.startsWith("<!--") && firstLine.endsWith("-->") ? firstLine : null;
}

// ---- generic section slicing -------------------------------------------

/** Body text between a `level`-hash header matching `name` and the next header of the same or shallower level (or EOF). */
function extractSection(source: string, name: string, level: number): string | null {
  const hashes = "#".repeat(level);
  const headerRe = new RegExp(`^${hashes}\\s+${escapeRegExp(name)}\\s*$`, "m");
  const match = headerRe.exec(source);
  if (!match) return null;
  const bodyStart = match.index + match[0].length;
  const rest = source.slice(bodyStart);
  // Only a header at this level or SHALLOWER ends the section — a level-2
  // "## Professional Experience" section legitimately contains level-3
  // "### <job title>" sub-headers within its own body, so those must not
  // be treated as the section boundary.
  const nextHeaderRe = new RegExp(`^#{1,${level}}\\s+`, "m");
  const nextMatch = nextHeaderRe.exec(rest);
  const bodyEnd = nextMatch ? nextMatch.index : rest.length;
  return rest.slice(0, bodyEnd).trim();
}

/** Replace a section's body in-place, preserving everything else in `source` byte-for-byte. */
function replaceSection(source: string, name: string, level: number, newBody: string): string {
  const hashes = "#".repeat(level);
  const headerRe = new RegExp(`^${hashes}\\s+${escapeRegExp(name)}\\s*$`, "m");
  const match = headerRe.exec(source);
  if (!match) {
    throw new Error(`Section "${name}" not found at level ${level}`);
  }
  const bodyStart = match.index + match[0].length;
  const rest = source.slice(bodyStart);
  const nextHeaderRe = new RegExp(`^#{1,${level}}\\s+`, "m");
  const nextMatch = nextHeaderRe.exec(rest);
  const bodyEnd = nextMatch ? nextMatch.index : rest.length;
  const before = source.slice(0, bodyStart);
  const after = rest.slice(bodyEnd);
  // Collapse any run of 3+ newlines down to exactly one blank line (\n\n) —
  // simpler and more robust than trying to predict exactly how many
  // newlines `before`/`after` already contribute at the splice points.
  return `${before}\n\n${newBody.trim()}\n\n${after}`.replace(/\n{3,}/g, "\n\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bulletLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2).trim());
}

function toBulletBlock(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

// ---- Identity ------------------------------------------------------------

function parseIdentityBullets(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of bulletLines(body)) {
    const m = /^\*\*([^:]+):\*\*\s*(.*)$/.exec(line);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

// ---- Education (table in 01-candidate-profile.md) -------------------------

function parseEducationTable(body: string): EducationEntry[] {
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines.filter((l) => l.startsWith("|") && !/^\|[\s-:|]+\|$/.test(l));
  const entries: EducationEntry[] = [];
  for (const row of rows) {
    const cells = row
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells[0] === "Degree") continue; // header row
    if (cells.length >= 3) {
      entries.push({ degree: cells[0], period: cells[1] === "-" ? "" : cells[1], institution: cells[2] });
    }
  }
  return entries;
}

function serializeEducationTable(entries: EducationEntry[]): string {
  const header = "| Degree | Period | Institution | Key Topics |";
  const sep = "|--------|--------|-------------|------------|";
  const rows = entries.map(
    (e) => `| ${e.degree} | ${e.period || "-"} | ${e.institution} | Computer science fundamentals |`,
  );
  return [header, sep, ...rows].join("\n");
}

function serializeEducationBullets(entries: EducationEntry[]): string {
  return entries
    .map((e) => `- **${e.degree}**${e.period ? ` (${e.period})` : ""} - ${e.institution}`)
    .join("\n");
}

// ---- Experience (### headers) --------------------------------------------

/**
 * 01-candidate-profile.md format:
 *   ### Title - Company (Dates)
 *   Location (Employment type)
 *   <body...>
 */
function parseExperienceEntries(body: string): ExperienceEntry[] {
  const entries: ExperienceEntry[] = [];
  const blocks = body.split(/^###\s+/m).slice(1);
  for (const block of blocks) {
    const lines = block.split("\n");
    const headerLine = lines[0].trim();
    const m = /^(.+?)\s+-\s+(.+?)\s*\(([^)]+)\)\s*$/.exec(headerLine);
    let title = headerLine;
    let company = "";
    let dates = "";
    if (m) {
      title = m[1].trim();
      company = m[2].trim();
      dates = m[3].trim();
    }
    let rest = lines.slice(1).join("\n").trim();
    let location = "";
    const locMatch = /^([^\n]+)\n/.exec(rest + "\n");
    if (locMatch && !locMatch[1].trim().startsWith("-") && !locMatch[1].trim().startsWith("*")) {
      location = locMatch[1].trim();
      rest = rest.slice(locMatch[1].length).trim();
    }
    entries.push({ title, company, dates, location, body: rest });
  }
  return entries;
}

function serializeExperienceEntries(entries: ExperienceEntry[]): string {
  return entries
    .map((e) => {
      const header = `### ${e.title} - ${e.company} (${e.dates})`;
      const loc = e.location ? `${e.location}\n\n` : "";
      return `${header}\n${loc}${e.body.trim()}`;
    })
    .join("\n\n");
}

/**
 * CLAUDE.md format is flatter: a single bullet list where each job is
 * `- **Title** (Dates) - **Company** (Location)` followed by indented
 * sub-bullets. Regenerated from the same ExperienceEntry[] on save.
 */
function serializeExperienceBulletsForClaudeMd(entries: ExperienceEntry[]): string {
  return entries
    .map((e) => {
      const head = `- **${e.title}** (${e.dates}) - **${e.company}**${e.location ? ` (${e.location})` : ""}`;
      const subBullets = e.body
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("-"))
        .map((l) => `  ${l}`)
        .join("\n");
      return subBullets ? `${head}\n${subBullets}` : head;
    })
    .join("\n");
}

// ---- Skills ----------------------------------------------------------------

function parseSkillsClaudeMd(body: string): CandidateProfile["skills"] {
  const out = { primary: "", secondary: "", domain: "", software: "" };
  for (const line of bulletLines(body)) {
    const m = /^\*\*([^:]+):\*\*\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    if (key === "primary") out.primary = m[2].trim();
    else if (key === "secondary") out.secondary = m[2].trim();
    else if (key === "domain") out.domain = m[2].trim();
    else if (key === "software") out.software = m[2].trim();
  }
  return out;
}

function serializeSkillsClaudeMd(skills: CandidateProfile["skills"]): string {
  return [
    `- **Primary:** ${skills.primary}`,
    `- **Secondary:** ${skills.secondary}`,
    `- **Domain:** ${skills.domain}`,
    `- **Software:** ${skills.software}`,
  ].join("\n");
}

// ---- top-level load/save ----------------------------------------------------

export async function loadCandidateProfile(): Promise<CandidateProfile> {
  const [claudeMd, candidateMd] = await Promise.all([
    fs.readFile(claudeMdPath(), "utf8"),
    fs.readFile(candidateProfilePath(), "utf8"),
  ]);

  const identityBody = extractSection(candidateMd, "Identity", 2) ?? "";
  const identityFields = parseIdentityBullets(identityBody);

  const educationBody = extractSection(candidateMd, "Education", 2) ?? "";
  const education = parseEducationTable(educationBody);

  const experienceBody = extractSection(candidateMd, "Professional Experience", 2) ?? "";
  const experience = parseExperienceEntries(experienceBody);

  const skillsSection = extractSection(candidateMd, "Technical Skills", 2) ?? "";
  const claudeMdSkillsBody = extractSection(claudeMd, "Technical Skills", 3) ?? "";
  const skills =
    claudeMdSkillsBody.length > 0
      ? parseSkillsClaudeMd(claudeMdSkillsBody)
      : { primary: skillsSection, secondary: "", domain: "", software: "" };

  const certificationsBody = extractSection(claudeMd, "Certifications", 3) ?? "";
  const certifications = bulletLines(certificationsBody);

  const publications = extractSection(candidateMd, "Publications", 2) ?? "";
  const awards = extractSection(candidateMd, "Awards", 2) ?? "";
  const independentProjects = extractSection(candidateMd, "Independent Projects", 2) ?? "";
  const references = extractSection(candidateMd, "References", 2) ?? "";

  const behavioralBody = extractSection(claudeMd, "Behavioral Profile", 3) ?? "";
  const whatExcitesBody = extractSection(claudeMd, "What Excites You", 3) ?? "";
  const targetSectorsBody = extractSection(claudeMd, "Target Sectors", 3) ?? "";
  const dealBreakersBody = extractSection(claudeMd, "Deal-breakers", 3) ?? "";

  return {
    identity: {
      name: identityFields["Name"] ?? "",
      location: identityFields["Location"] ?? "",
      phone: identityFields["Phone"] ?? "",
      email: identityFields["Email"] ?? "",
      linkedin: identityFields["LinkedIn"] ?? "",
      portfolio: identityFields["Portfolio"] ?? "",
      languages: identityFields["Languages"] ?? "",
      status: identityFields["Status"] ?? "",
      constraints: identityFields["Constraints"] ?? "",
    },
    education,
    experience,
    skills,
    certifications,
    publications,
    awards,
    independentProjects,
    references,
    behavioralProfile: bulletLines(behavioralBody).filter((l) => !l.startsWith("Source:")),
    whatExcitesYou: bulletLines(whatExcitesBody),
    targetSectors: bulletLines(targetSectorsBody),
    dealBreakers: bulletLines(dealBreakersBody),
  };
}

export async function saveCandidateProfile(profile: CandidateProfile): Promise<void> {
  let claudeMd = await fs.readFile(claudeMdPath(), "utf8");
  let candidateMd = await fs.readFile(candidateProfilePath(), "utf8");

  // --- shared sections: write into both files, each in its own style ---
  const identityBulletsCandidate = [
    `- **Name:** ${profile.identity.name}`,
    `- **Location:** ${profile.identity.location}`,
    `- **Phone:** ${profile.identity.phone || "Not provided yet - add when available"}`,
    `- **Email:** ${profile.identity.email}`,
    `- **LinkedIn:** ${profile.identity.linkedin}`,
    `- **Portfolio:** ${profile.identity.portfolio}`,
    `- **Languages:** ${profile.identity.languages}`,
    `- **Status:** ${profile.identity.status}`,
    `- **Constraints:** ${profile.identity.constraints}`,
  ].join("\n");
  candidateMd = replaceSection(candidateMd, "Identity", 2, identityBulletsCandidate);

  const identityBulletsClaude = [
    `- **Name:** ${profile.identity.name}`,
    `- **Location:** ${profile.identity.location}`,
    `- **Languages:** ${profile.identity.languages}`,
    `- **Status:** ${profile.identity.status}`,
  ].join("\n");
  claudeMd = replaceSection(claudeMd, "Identity", 3, identityBulletsClaude);

  candidateMd = replaceSection(candidateMd, "Education", 2, serializeEducationTable(profile.education));
  claudeMd = replaceSection(claudeMd, "Education", 3, serializeEducationBullets(profile.education));

  candidateMd = replaceSection(
    candidateMd,
    "Professional Experience",
    2,
    serializeExperienceEntries(profile.experience),
  );
  claudeMd = replaceSection(
    claudeMd,
    "Professional Experience",
    3,
    serializeExperienceBulletsForClaudeMd(profile.experience),
  );

  claudeMd = replaceSection(claudeMd, "Technical Skills", 3, serializeSkillsClaudeMd(profile.skills));

  const certBlock = toBulletBlock(profile.certifications);
  claudeMd = replaceSection(claudeMd, "Certifications", 3, certBlock);
  // Schema correction: 01-candidate-profile.md has no Certifications section
  // today. Insert one (after Education) the first time a save includes any.
  if (!extractSection(candidateMd, "Certifications", 2) && profile.certifications.length > 0) {
    candidateMd = candidateMd.replace(
      /(## Professional Experience)/,
      `## Certifications\n\n${certBlock}\n\n$1`,
    );
  } else if (extractSection(candidateMd, "Certifications", 2)) {
    candidateMd = replaceSection(candidateMd, "Certifications", 2, certBlock);
  }

  candidateMd = replaceSection(candidateMd, "Publications", 2, profile.publications || "None currently.");
  candidateMd = replaceSection(candidateMd, "Awards", 2, profile.awards || "None currently.");
  candidateMd = replaceSection(
    candidateMd,
    "Independent Projects",
    2,
    profile.independentProjects || "None yet.",
  );
  candidateMd = replaceSection(candidateMd, "References", 2, profile.references || "None listed yet.");

  // --- CLAUDE.md-only sections ---
  // Preserve each section's existing leading <!-- comment --> (provenance/
  // confidence notes like "inferred, confirm/adjust") rather than silently
  // dropping it — the form only edits the bullet content, not this metadata.
  const behavioralComment =
    extractLeadingComment(extractSection(claudeMd, "Behavioral Profile", 3)) ??
    "<!-- Source: Predictive Index-style behavioral assessment provided by candidate -->";
  const excitesComment = extractLeadingComment(extractSection(claudeMd, "What Excites You", 3));
  const sectorsComment = extractLeadingComment(extractSection(claudeMd, "Target Sectors", 3));
  const dealBreakersComment = extractLeadingComment(extractSection(claudeMd, "Deal-breakers", 3));

  claudeMd = replaceSection(
    claudeMd,
    "Behavioral Profile",
    3,
    `${behavioralComment}\n${toBulletBlock(profile.behavioralProfile)}`,
  );
  claudeMd = replaceSection(
    claudeMd,
    "What Excites You",
    3,
    (excitesComment ? `${excitesComment}\n` : "") + toBulletBlock(profile.whatExcitesYou),
  );
  claudeMd = replaceSection(
    claudeMd,
    "Target Sectors",
    3,
    (sectorsComment ? `${sectorsComment}\n` : "") + toBulletBlock(profile.targetSectors),
  );
  claudeMd = replaceSection(
    claudeMd,
    "Deal-breakers",
    3,
    (dealBreakersComment ? `${dealBreakersComment}\n` : "") + toBulletBlock(profile.dealBreakers),
  );

  // Final whole-file normalization: many sequential replaceSection calls
  // each locally guarantee "at most one blank line" at their own splice
  // points, but a run of them can still compound extra blank lines at
  // section boundaries touched more than once. Cheaper and more robust to
  // normalize once at the end than to reason about every intermediate step.
  claudeMd = claudeMd.replace(/\n{3,}/g, "\n\n");
  candidateMd = candidateMd.replace(/\n{3,}/g, "\n\n");

  await Promise.all([
    fs.writeFile(claudeMdPath(), claudeMd, "utf8"),
    fs.writeFile(candidateProfilePath(), candidateMd, "utf8"),
  ]);
}
