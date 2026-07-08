export interface ActionField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "checkbox" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
}

export interface ActionDef {
  id: string;
  title: string;
  description: string;
  danger?: boolean;
  fields: ActionField[];
  buildInitialPrompt: (input: Record<string, string>) => string;
}

/**
 * Server Components can't pass functions to Client Components (RSC
 * serialization boundary) — buildInitialPrompt only ever runs server-side
 * inside the skill-runner API route anyway. This is what gets handed to
 * <ChatRunner>.
 */
export type ClientActionDef = Omit<ActionDef, "buildInitialPrompt">;

export function toClientAction(action: ActionDef): ClientActionDef {
  const { id, title, description, danger, fields } = action;
  return { id, title, description, danger, fields };
}

/**
 * Shared between the apply action's buildInitialPrompt (embeds this in the
 * prompt so Claude can write it into the tracker via apply.md Step 7) and
 * the skill-runner start route's post-run reconciliation fallback — both
 * need the exact same "what URL did the user mean" derivation, so it lives
 * here once rather than risking the two copies drifting apart.
 */
export function deriveApplyJobUrl(input: Record<string, string>): string {
  const jobText = (input.jobText ?? "").trim();
  const explicitUrl = (input.jobUrl ?? "").trim();
  const looksLikeUrl = /^https?:\/\//i.test(jobText);
  return explicitUrl || (looksLikeUrl ? jobText : "none provided");
}

function requireField(input: Record<string, string>, key: string): string {
  const v = (input[key] ?? "").trim();
  if (!v) throw new Error(`Missing required field: ${key}`);
  return v;
}

export const ACTIONS: Record<string, ActionDef> = {
  scrape: {
    id: "scrape",
    title: "Find New Jobs",
    description: "Runs the job-scraper skill to find new postings matching your profile.",
    fields: [
      {
        key: "focus",
        label: "Focus area (optional)",
        kind: "text",
        placeholder: "e.g. forward deployed engineer, remote",
      },
      {
        key: "broad",
        label: "Broad search (cast a wider net)",
        kind: "checkbox",
      },
    ],
    buildInitialPrompt: (input) => {
      if (input.broad === "true") return "/scrape broad";
      const focus = (input.focus ?? "").trim();
      return focus ? `/scrape ${focus}` : "/scrape";
    },
  },

  apply: {
    id: "apply",
    title: "Get Ready for a Job",
    description: "Evaluates fit, drafts a tailored CV + cover letter, and records the application.",
    fields: [
      {
        key: "jobText",
        label: "Job URL or pasted posting text",
        kind: "textarea",
        required: true,
        placeholder: "Paste a URL or the full job posting text",
      },
      {
        key: "jobUrl",
        label: "Job URL (fill in if you pasted text above instead of a link)",
        kind: "text",
        placeholder: "https://...",
      },
    ],
    buildInitialPrompt: (input) => {
      const jobText = requireField(input, "jobText");
      const canonicalUrl = deriveApplyJobUrl(input);
      return `/apply ${jobText}\n\n[Frontend metadata: canonical job URL = ${canonicalUrl}. When recording this application in job_search_tracker.csv, use exactly this value for the job_url column.]`;
    },
  },

  upskill: {
    id: "upskill",
    title: "Skill Gap Check",
    description: "Compares tracked applications (or one posting) against your profile and builds a learning plan.",
    fields: [
      {
        key: "mode",
        label: "Scope",
        kind: "select",
        options: [
          { value: "all", label: "All tracked jobs" },
          { value: "targeted", label: "Specific job URL" },
        ],
      },
      {
        key: "url",
        label: "Job URL (only for targeted mode)",
        kind: "text",
        placeholder: "https://...",
      },
    ],
    buildInitialPrompt: (input) => {
      if (input.mode === "targeted") {
        const url = requireField(input, "url");
        return `/upskill ${url}`;
      }
      return "/upskill";
    },
  },

  expand: {
    id: "expand",
    title: "Expand Profile",
    description: "Scans documents/ and other profile sources to enrich your candidate profile.",
    fields: [],
    buildInitialPrompt: () => "/expand",
  },

  "add-template": {
    id: "add-template",
    title: "Add Template",
    description: "List, register, or switch active CV / cover-letter templates.",
    fields: [
      {
        key: "mode",
        label: "Mode",
        kind: "select",
        options: [
          { value: "list", label: "List templates" },
          { value: "register", label: "Register new (file path)" },
          { value: "use", label: "Switch active template" },
        ],
      },
      {
        key: "path",
        label: "Template file path (register mode)",
        kind: "text",
        placeholder: "e.g. documents/my-template.tex",
      },
      {
        key: "name",
        label: "Template name (switch mode)",
        kind: "text",
        placeholder: "e.g. default",
      },
    ],
    buildInitialPrompt: (input) => {
      if (input.mode === "register") return `/add-template ${requireField(input, "path")}`;
      if (input.mode === "use") return `/add-template --use ${requireField(input, "name")}`;
      return "/add-template --list";
    },
  },

  "add-portal": {
    id: "add-portal",
    title: "Add Job Portal",
    description: "List installed job-portal search skills, or add a new one from a portal URL.",
    fields: [
      {
        key: "mode",
        label: "Mode",
        kind: "select",
        options: [
          { value: "list", label: "List portals" },
          { value: "add", label: "Add new portal" },
        ],
      },
      {
        key: "url",
        label: "Portal URL (add mode)",
        kind: "text",
        placeholder: "https://...",
      },
    ],
    buildInitialPrompt: (input) => {
      if (input.mode === "add") return `/add-portal ${requireField(input, "url")}`;
      return "/add-portal --list";
    },
  },

  reset: {
    id: "reset",
    title: "Reset Data",
    description: "Destructive. Wipes profile data, documents, or both. You'll still need to type RESET to confirm.",
    danger: true,
    fields: [
      {
        key: "scope",
        label: "What to reset",
        kind: "select",
        required: true,
        options: [
          { value: "profile", label: "Profile only" },
          { value: "documents", label: "Documents only" },
          { value: "all", label: "Everything" },
        ],
      },
    ],
    buildInitialPrompt: (input) => `/reset ${requireField(input, "scope")}`,
  },
};

export function getAction(id: string): ActionDef | undefined {
  return ACTIONS[id];
}
