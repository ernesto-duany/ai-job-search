"use client";

import { useEffect, useState } from "react";

interface AccountEntry {
  id: string;
  label: string;
  repoPath: string;
}

export function AccountSwitcher() {
  const [accounts, setAccounts] = useState<AccountEntry[]>([]);
  const [active, setActive] = useState<string>("");
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPath, setNewPath] = useState("");
  const [adding, setAdding] = useState(false);

  function load() {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data.accounts ?? []);
        setActive(data.active ?? "");
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSwitch(id: string) {
    if (id === active) return;
    setSwitching(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.status === 409) {
        const info = await res.json().catch(() => ({}));
        setError(`Can't switch — ${info.activeAction ?? "a run"} is in progress.`);
        return;
      }
      if (!res.ok) {
        setError("Switch failed.");
        return;
      }
      // Every page fetches account-scoped data on its own mount (tracker,
      // profile, etc.) — a full reload is the simplest way to guarantee
      // all of it refreshes for the new active account, and switching
      // accounts isn't a frequent-enough action for that to matter.
      window.location.reload();
    } finally {
      setSwitching(false);
    }
  }

  async function handleAdd() {
    if (!newLabel.trim() || !newPath.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), repoPath: newPath.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add account.");
        return;
      }
      setAccounts(data.accounts ?? []);
      setNewLabel("");
      setNewPath("");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  }

  if (accounts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <select
        value={active}
        disabled={switching}
        onChange={(e) => handleSwitch(e.target.value)}
        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-900"
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowAdd((s) => !s)}
        className="text-xs text-neutral-500 hover:underline"
      >
        + Add account
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}

      {showAdd && (
        <div className="absolute right-6 top-14 z-20 flex w-72 flex-col gap-2 rounded border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Display name</span>
            <input
              className="rounded border border-neutral-300 p-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-950"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Sarah"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium">Local repo path</span>
            <input
              className="rounded border border-neutral-300 p-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-950"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/path/to/their/ai-job-search"
            />
          </label>
          <p className="text-[11px] text-neutral-500">
            Must already exist with a CLAUDE.md — clone the repo there and run &ldquo;/setup&rdquo; first if you haven&rsquo;t.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-xs text-neutral-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
