import { createClient } from "../../../lib/supabase/server";
import type { ScrapeRunStatus } from "../../../lib/types";
import { Pagination } from "../Pagination";
import { Tabs } from "../Tabs";
import { ScrapeRunsTable } from "./ScrapeRunsTable";
import { TriggerScrapeButton } from "./TriggerScrapeButton";

const PAGE_SIZE = 25;
const RUN_STATUSES: ScrapeRunStatus[] = ["pending", "running", "succeeded", "failed", "aborted"];
const STATUS_TABS: { value: ScrapeRunStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "running", label: "Corriendo" },
  { value: "succeeded", label: "Completado" },
  { value: "failed", label: "Fallido" },
  { value: "aborted", label: "Abortado" },
];

function isRunStatus(value: string): value is ScrapeRunStatus {
  return (RUN_STATUSES as string[]).includes(value);
}

export default async function ScrapesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "todos";
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("scrape_runs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "todos" && isRunStatus(status)) {
    query = query.eq("status", status);
  }

  const { data: runs, error, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

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

      <Tabs basePath="/scrapes" paramName="status" current={status} options={STATUS_TABS} searchParams={params} />

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando scrape runs: {error.message}
        </p>
      )}

      <ScrapeRunsTable
        key={`${status}-${page}`}
        initialRuns={runs ?? []}
        page={page}
        status={status}
        pageSize={PAGE_SIZE}
      />
      <Pagination basePath="/scrapes" currentPage={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
