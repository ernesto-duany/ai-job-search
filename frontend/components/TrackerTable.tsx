"use client";

import { useEffect, useState } from "react";

interface TrackerRow {
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

function pdfHref(texPath: string): string | null {
  if (!texPath) return null;
  const trimmed = texPath.trim();
  let type: string | null = null;
  let rest = trimmed;
  if (trimmed.startsWith("cv/")) {
    type = "cv";
    rest = trimmed.slice("cv/".length);
  } else if (trimmed.startsWith("cover_letters/")) {
    type = "cover_letters";
    rest = trimmed.slice("cover_letters/".length);
  } else {
    return null;
  }
  const pdfName = rest.replace(/\.tex$/i, ".pdf");
  return `/api/files/${type}/${encodeURIComponent(pdfName)}`;
}

function JobUrlCell({ row, onSaved }: { row: TrackerRow; onSaved: (rows: TrackerRow[]) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.job_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tracker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: row.index, jobUrl: value.trim() }),
      });
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        setError(info.error === "busy" ? "Busy — try again shortly." : "Save failed.");
        return;
      }
      const data = await res.json();
      onSaved(data.rows);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <input
          className="w-48 rounded border border-neutral-300 p-1 text-xs dark:border-neutral-600 dark:bg-neutral-900"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://..."
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue(row.job_url);
              setError(null);
            }}
            className="text-xs text-neutral-500 hover:underline"
          >
            Cancel
          </button>
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  if (!row.job_url) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-neutral-400 hover:underline"
      >
        + add link
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <a
        href={row.job_url}
        target="_blank"
        rel="noopener noreferrer"
        className="max-w-[160px] truncate text-xs text-blue-600 hover:underline"
        title={row.job_url}
      >
        {row.job_url}
      </a>
      {row.job_url_source === "auto-matched" && (
        <span
          title="Auto-matched from job_scraper/seen_jobs.json — verify this is correct"
          className="rounded bg-amber-100 px-1 text-[10px] text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        >
          auto
        </span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[10px] text-neutral-400 hover:underline"
      >
        edit
      </button>
    </div>
  );
}

function FitBadge({ value }: { value: string }) {
  const n = Number(value);
  if (Number.isNaN(n)) return <span className="text-xs text-neutral-400">—</span>;
  const tone =
    n >= 80
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : n >= 60
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${tone}`}>{n}</span>;
}

export function TrackerTable() {
  const [rows, setRows] = useState<TrackerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tracker")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRows(data.rows);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load tracker.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!rows) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (rows.length === 0)
    return <p className="text-sm text-neutral-500">No applications tracked yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-500 dark:border-neutral-700">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Company</th>
            <th className="py-2 pr-3">Role</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Fit</th>
            <th className="py-2 pr-3">Job URL</th>
            <th className="py-2 pr-3">CV</th>
            <th className="py-2 pr-3">Cover Letter</th>
            <th className="py-2 pr-3">Channel</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cvHref = pdfHref(row.cv_file);
            const clHref = pdfHref(row.cover_letter_file);
            return (
              <tr
                key={row.index}
                className="border-b border-neutral-100 align-top dark:border-neutral-800"
              >
                <td className="py-2 pr-3 whitespace-nowrap text-xs text-neutral-500">{row.date}</td>
                <td className="py-2 pr-3 font-medium">{row.company}</td>
                <td className="py-2 pr-3">{row.role}</td>
                <td className="py-2 pr-3 text-xs">{row.status}</td>
                <td className="py-2 pr-3">
                  <FitBadge value={row.fit_rating} />
                </td>
                <td className="py-2 pr-3">
                  <JobUrlCell row={row} onSaved={setRows} />
                </td>
                <td className="py-2 pr-3">
                  {cvHref ? (
                    <a href={cvHref} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      PDF
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  {clHref ? (
                    <a href={clHref} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      PDF
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-xs text-neutral-500">{row.channel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
