"use client";

import { useEffect, useState } from "react";
import type { CandidateProfile, EducationEntry, ExperienceEntry } from "@/lib/profileParser";

const inputCls =
  "w-full rounded border border-neutral-300 p-2 text-sm dark:border-neutral-600 dark:bg-neutral-900";
const labelCls = "flex flex-col gap-1 text-sm";
const sectionCls = "flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700";
const sectionTitleCls = "text-sm font-semibold uppercase tracking-wide text-neutral-500";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={labelCls}>
      <span className="font-medium">{label}</span>
      <input
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  help?: string;
}) {
  return (
    <label className={labelCls}>
      <span className="font-medium">{label}</span>
      {help && <span className="text-xs text-neutral-500">{help}</span>}
      <textarea
        className={inputCls}
        style={{ minHeight: `${rows * 1.5}rem` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** One item per line, split/joined on save. */
function ListField({
  label,
  items,
  onChange,
  help,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  help?: string;
}) {
  return (
    <TextAreaField
      label={label}
      help={help ?? "One item per line."}
      value={items.join("\n")}
      onChange={(text) => onChange(text.split("\n").map((l) => l.trim()).filter(Boolean))}
      rows={Math.max(3, items.length + 1)}
    />
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-xs text-red-600 hover:underline"
    >
      Remove
    </button>
  );
}

function EducationEditor({
  entries,
  onChange,
}: {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}) {
  function update(i: number, patch: Partial<EducationEntry>) {
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  return (
    <div className={sectionCls}>
      <span className={sectionTitleCls}>Education</span>
      {entries.map((e, i) => (
        <div key={i} className="flex flex-col gap-2 rounded border border-neutral-100 p-3 dark:border-neutral-800">
          <Field label="Degree" value={e.degree} onChange={(v) => update(i, { degree: v })} />
          <Field label="Period" value={e.period} onChange={(v) => update(i, { period: v })} placeholder="e.g. Oct 2023 - Oct 2024" />
          <Field label="Institution" value={e.institution} onChange={(v) => update(i, { institution: v })} />
          <RemoveButton onClick={() => onChange(entries.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...entries, { degree: "", period: "", institution: "" }])}
        className="self-start text-xs text-blue-600 hover:underline"
      >
        + Add education entry
      </button>
    </div>
  );
}

function ExperienceEditor({
  entries,
  onChange,
}: {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
}) {
  function update(i: number, patch: Partial<ExperienceEntry>) {
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className={sectionCls}>
      <span className={sectionTitleCls}>Professional Experience</span>
      <p className="text-xs text-neutral-500">
        Bullets are edited as one block per job (not split into individual fields) — some entries nest
        named sub-projects and a flat bullet editor risks flattening that structure.
      </p>
      {entries.map((e, i) => (
        <div key={i} className="flex flex-col gap-2 rounded border border-neutral-100 p-3 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Title" value={e.title} onChange={(v) => update(i, { title: v })} />
            <Field label="Company" value={e.company} onChange={(v) => update(i, { company: v })} />
            <Field label="Dates" value={e.dates} onChange={(v) => update(i, { dates: v })} placeholder="e.g. Jan 2020 - Present" />
            <Field label="Location" value={e.location} onChange={(v) => update(i, { location: v })} />
          </div>
          <TextAreaField
            label="Bullets (markdown)"
            value={e.body}
            onChange={(v) => update(i, { body: v })}
            rows={6}
          />
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => move(i, -1)} className="text-xs text-neutral-500 hover:underline">
              Move up
            </button>
            <button type="button" onClick={() => move(i, 1)} className="text-xs text-neutral-500 hover:underline">
              Move down
            </button>
            <RemoveButton onClick={() => onChange(entries.filter((_, idx) => idx !== i))} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...entries, { title: "", company: "", dates: "", location: "", body: "" }])
        }
        className="self-start text-xs text-blue-600 hover:underline"
      >
        + Add experience entry
      </button>
    </div>
  );
}

export function ProfileForm() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.status === 409) {
        const info = await res.json().catch(() => ({}));
        setError(`Busy: ${info.activeAction ?? "another run"} is mid-edit on profile files. Try again shortly.`);
        return;
      }
      if (!res.ok) {
        const info = await res.json().catch(() => ({}));
        setError(info.message ?? info.error ?? "Save failed.");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (error && !profile) return <p className="text-sm text-red-600">{error}</p>;
  if (!profile) return null;

  const p = profile;
  function patch<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }
  function patchIdentity(key: keyof CandidateProfile["identity"], value: string) {
    setProfile((prev) => (prev ? { ...prev, identity: { ...prev.identity, [key]: value } } : prev));
  }
  function patchSkills(key: keyof CandidateProfile["skills"], value: string) {
    setProfile((prev) => (prev ? { ...prev, skills: { ...prev.skills, [key]: value } } : prev));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-neutral-200 bg-white py-3 dark:border-neutral-700 dark:bg-neutral-950">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Identity</span>
        <Field label="Name" value={p.identity.name} onChange={(v) => patchIdentity("name", v)} />
        <Field label="Location" value={p.identity.location} onChange={(v) => patchIdentity("location", v)} />
        <Field label="Phone" value={p.identity.phone} onChange={(v) => patchIdentity("phone", v)} />
        <Field label="Email" value={p.identity.email} onChange={(v) => patchIdentity("email", v)} />
        <Field label="LinkedIn" value={p.identity.linkedin} onChange={(v) => patchIdentity("linkedin", v)} />
        <Field label="Portfolio" value={p.identity.portfolio} onChange={(v) => patchIdentity("portfolio", v)} />
        <Field label="Languages" value={p.identity.languages} onChange={(v) => patchIdentity("languages", v)} />
        <Field label="Status" value={p.identity.status} onChange={(v) => patchIdentity("status", v)} />
        <Field label="Constraints" value={p.identity.constraints} onChange={(v) => patchIdentity("constraints", v)} />
      </div>

      <EducationEditor entries={p.education} onChange={(v) => patch("education", v)} />
      <ExperienceEditor entries={p.experience} onChange={(v) => patch("experience", v)} />

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Technical Skills</span>
        <TextAreaField label="Primary" value={p.skills.primary} onChange={(v) => patchSkills("primary", v)} rows={2} />
        <TextAreaField label="Secondary" value={p.skills.secondary} onChange={(v) => patchSkills("secondary", v)} rows={2} />
        <TextAreaField label="Domain" value={p.skills.domain} onChange={(v) => patchSkills("domain", v)} rows={2} />
        <TextAreaField label="Software" value={p.skills.software} onChange={(v) => patchSkills("software", v)} rows={2} />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Certifications</span>
        <ListField items={p.certifications} onChange={(v) => patch("certifications", v)} label="" />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Other</span>
        <TextAreaField label="Publications" value={p.publications} onChange={(v) => patch("publications", v)} rows={2} />
        <TextAreaField label="Awards" value={p.awards} onChange={(v) => patch("awards", v)} rows={2} />
        <TextAreaField
          label="Independent Projects"
          value={p.independentProjects}
          onChange={(v) => patch("independentProjects", v)}
          rows={3}
        />
        <TextAreaField label="References" value={p.references} onChange={(v) => patch("references", v)} rows={2} />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Behavioral Profile</span>
        <ListField items={p.behavioralProfile} onChange={(v) => patch("behavioralProfile", v)} label="" />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>What Excites You</span>
        <ListField items={p.whatExcitesYou} onChange={(v) => patch("whatExcitesYou", v)} label="" />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Target Sectors</span>
        <ListField items={p.targetSectors} onChange={(v) => patch("targetSectors", v)} label="" />
      </div>

      <div className={sectionCls}>
        <span className={sectionTitleCls}>Deal-breakers</span>
        <ListField items={p.dealBreakers} onChange={(v) => patch("dealBreakers", v)} label="" />
      </div>
    </div>
  );
}
