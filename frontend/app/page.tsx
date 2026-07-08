import { ACTIONS, toClientAction } from "@/lib/actions";
import { ActionCard } from "@/components/ActionCard";
import { HealthBanner } from "@/components/HealthBanner";

const CORE = ["scrape", "apply", "upskill"];
const ADMIN = ["expand", "add-template", "add-portal", "reset"];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Job Search Assistant</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Local control panel for the ai-job-search Claude Code workflow. Every action here
          spawns a real Claude Code session against this repo — Claude still does all the
          thinking.
        </p>
      </div>

      <HealthBanner />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Day to day
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CORE.map((id) => (
            <ActionCard key={id} action={toClientAction(ACTIONS[id])} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Admin
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ADMIN.map((id) => (
            <ActionCard key={id} action={toClientAction(ACTIONS[id])} />
          ))}
        </div>
      </section>
    </div>
  );
}
