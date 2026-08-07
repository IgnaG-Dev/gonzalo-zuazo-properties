import { createClient } from "../../../lib/supabase/server";
import { TriggerScrapeButton } from "./TriggerScrapeButton";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  running: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
  succeeded: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  aborted: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

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

      {runs?.length === 0 ? (
        <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Todavía no se ejecutó ninguna corrida
          </p>
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
            Usá &ldquo;Ejecutar ahora&rdquo; para disparar una corrida manual, o activá el scraping
            automático en Configuración.
          </p>
        </div>
      ) : (
        <div className="table-shell">
          <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="table-head-cell">Run ID</th>
                <th className="table-head-cell">Estado</th>
                <th className="table-head-cell text-right">Creados</th>
                <th className="table-head-cell text-right">Actualizados</th>
                <th className="table-head-cell text-right">Agencias</th>
                <th className="table-head-cell text-right">Inválidos</th>
                <th className="table-head-cell">Error</th>
                <th className="table-head-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {(runs ?? []).map((run) => (
                <tr key={run.id} className="table-row">
                  <td className="table-cell font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    {run.apify_run_id}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="table-cell text-right tabular-nums">{run.leads_created}</td>
                  <td className="table-cell text-right tabular-nums">{run.leads_updated}</td>
                  <td className="table-cell text-right tabular-nums">{run.leads_skipped_agency}</td>
                  <td className="table-cell text-right tabular-nums">{run.leads_skipped_invalid}</td>
                  <td
                    className="table-cell max-w-xs truncate text-red-600 dark:text-red-400"
                    title={run.error_message ?? ""}
                  >
                    {run.error_message ?? "—"}
                  </td>
                  <td className="table-cell text-neutral-500 dark:text-neutral-500">
                    {new Date(run.created_at).toLocaleString("es-ES")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
