import { TrackerTable } from "@/components/TrackerTable";

export default function ApplicationsPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-xl font-semibold">Applications</h1>
      <p className="mt-2 mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Tracked from job_search_tracker.csv. Job links marked &ldquo;auto&rdquo; were
        fuzzy-matched from job_scraper/seen_jobs.json — verify before trusting them.
      </p>
      <TrackerTable />
    </div>
  );
}
