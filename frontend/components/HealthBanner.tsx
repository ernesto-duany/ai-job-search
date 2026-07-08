"use client";

import { useEffect, useState } from "react";

interface CheckResult {
  ok: boolean;
  detail: string;
}

interface HealthResponse {
  claude: CheckResult;
  lualatex: CheckResult;
  xelatex: CheckResult;
  bun: CheckResult;
}

const LABELS: Record<keyof HealthResponse, string> = {
  claude: "Claude Code CLI",
  lualatex: "lualatex",
  xelatex: "xelatex",
  bun: "Bun",
};

export function HealthBanner() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  if (!health) return null;
  const failing = (Object.keys(LABELS) as (keyof HealthResponse)[]).filter((k) => !health[k].ok);
  if (failing.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <p className="font-medium">Missing prerequisites: {failing.map((k) => LABELS[k]).join(", ")}</p>
      <p className="mt-1 text-xs">
        Actions that need these will fail. Also make sure you&rsquo;ve run <code>claude</code> once
        interactively in the repo root and accepted the workspace-trust prompt — see the frontend
        README.
      </p>
    </div>
  );
}
