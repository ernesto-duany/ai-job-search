import Link from "next/link";
import type { ClientActionDef } from "@/lib/actions";

export function ActionCard({ action }: { action: ClientActionDef }) {
  return (
    <Link
      href={`/actions/${action.id}`}
      className={`flex flex-col gap-2 rounded-lg border p-4 transition hover:shadow-md ${
        action.danger
          ? "border-red-300 hover:border-red-400 dark:border-red-800"
          : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-700"
      }`}
    >
      <span className="font-semibold">{action.title}</span>
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{action.description}</span>
    </Link>
  );
}
