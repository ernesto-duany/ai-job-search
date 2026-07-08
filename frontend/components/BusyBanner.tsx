"use client";

import { useEffect, useState } from "react";

interface Status {
  busy: boolean;
  activeAction?: string;
  startedAt?: string;
}

export function BusyBanner() {
  const [status, setStatus] = useState<Status>({ busy: false });

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/skill-runner/status");
        if (!res.ok) return;
        const data = (await res.json()) as Status;
        if (!cancelled) setStatus(data);
      } catch {
        // network hiccup — try again next tick.
      }
    }
    poll();
    const id = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status.busy) return null;

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
      Claude is currently running <strong>{status.activeAction}</strong>. Other runs will queue until it finishes.
    </div>
  );
}
