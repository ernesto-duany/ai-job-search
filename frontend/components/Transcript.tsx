"use client";

import { useState } from "react";
import type { ActivityItem, TranscriptTurn } from "@/lib/client/types";

function ActivityLine({ item }: { item: ActivityItem }) {
  const [open, setOpen] = useState(false);
  const tone =
    item.kind === "permission_denial"
      ? "text-amber-700 dark:text-amber-400"
      : "text-neutral-500 dark:text-neutral-400";
  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${tone} hover:underline text-left`}
      >
        {item.kind === "permission_denial" ? "⚠ " : "· "}
        {item.label}
      </button>
      {open && item.detail !== undefined && (
        <pre className="mt-1 max-h-40 overflow-auto rounded bg-neutral-100 p-2 text-[11px] dark:bg-neutral-800">
          {JSON.stringify(item.detail, null, 2)}
        </pre>
      )}
    </div>
  );
}

function TurnBubble({ turn }: { turn: TranscriptTurn }) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
        }`}
      >
        {!isUser && turn.activity.length > 0 && (
          <div className="mb-2 space-y-1 border-b border-neutral-300/50 pb-2 dark:border-neutral-600/50">
            {turn.activity.map((item) => (
              <ActivityLine key={item.id} item={item} />
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm">
          {turn.text || (turn.status === "streaming" ? "…" : "")}
        </div>
        {!isUser && turn.status === "done" && turn.costUsd != null && (
          <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
            {(turn.durationMs ?? 0) / 1000 | 0}s · ${turn.costUsd.toFixed(3)}
          </div>
        )}
        {!isUser && turn.status === "error" && (
          <div className="mt-2 text-[11px] text-red-600 dark:text-red-400">
            This turn ended with an error.
          </div>
        )}
      </div>
    </div>
  );
}

export function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  if (turns.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 py-4">
      {turns.map((turn) => (
        <TurnBubble key={turn.id} turn={turn} />
      ))}
    </div>
  );
}
