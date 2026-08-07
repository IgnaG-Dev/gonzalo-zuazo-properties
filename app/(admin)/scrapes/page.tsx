import { createClient } from "../../../lib/supabase/server";
import { ScrapeRunsTable } from "./ScrapeRunsTable";
import { TriggerScrapeButton } from "./TriggerScrapeButton";

export default async function ScrapesPage() {
  const supabase = await createClient();
  const { data: runs, error } = await supabase
    .from("scrape_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Scrape runs
          </h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
            Extracción best-effort desde Idealista vía Apify — puede fallar si Idealista cambia su
            sitio o bloquea el pool de proxies.
          </p>
        </div>
        <TriggerScrapeButton />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando scrape runs: {error.message}
        </p>
      )}

      <ScrapeRunsTable initialRuns={runs ?? []} />
    </div>
  );
}
