"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import type { ScrapeRun } from "../../../lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  running: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
  succeeded: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  aborted: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

interface RunProgress {
  itemCount: number;
  logTail: string[];
}

const ACTIVE_STATUSES = new Set(["pending", "running"]);

export function ScrapeRunsTable({ initialRuns }: { initialRuns: ScrapeRun[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [progress, setProgress] = useState<Record<string, RunProgress>>({});

  // Realtime: refleja altas (nueva corrida) y cambios de estado (webhook de
  // Apify) apenas ocurren en la base, sin que el usuario recargue la página.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("scrape_runs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scrape_runs" },
        (payload) => {
          const inserted = payload.new as ScrapeRun;
          setRuns((prev) => [inserted, ...prev.filter((run) => run.id !== inserted.id)].slice(0, 50));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scrape_runs" },
        (payload) => {
          const updated = payload.new as ScrapeRun;
          setRuns((prev) => prev.map((run) => (run.id === updated.id ? updated : run)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeRunIds = useMemo(
    () => runs.filter((run) => ACTIVE_STATUSES.has(run.status)).map((run) => run.apify_run_id),
    [runs]
  );

  // Progreso real: mientras haya corridas activas, se consulta la API de
  // Apify (cantidad de items ya extraídos + log en vivo del actor).
  useEffect(() => {
    if (activeRunIds.length === 0) return;

    let cancelled = false;

    async function poll() {
      await Promise.all(
        activeRunIds.map(async (runId) => {
          try {
            const res = await fetch(`/api/scrapes/${runId}/progress`);
            if (!res.ok || cancelled) return;
            const data = (await res.json()) as { itemCount: number; logTail: string[] };
            if (cancelled) return;
            setProgress((prev) => ({ ...prev, [runId]: { itemCount: data.itemCount, logTail: data.logTail } }));
          } catch {
            // best-effort, se reintenta en el próximo tick
          }
        })
      );
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeRunIds]);

  if (runs.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Todavía no se ejecutó ninguna corrida
        </p>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
          Usá &ldquo;Ejecutar ahora&rdquo; para disparar una corrida manual, o activá el scraping
          automático en Configuración.
        </p>
      </div>
    );
  }

  return (
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
          {runs.map((run) => {
            const isActive = ACTIVE_STATUSES.has(run.status);
            const runProgress = progress[run.apify_run_id];

            return (
              <Fragment key={run.id}>
                <tr className="table-row">
                  <td className="table-cell font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    {run.apify_run_id}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
                      }`}
                    >
                      {isActive && (
                        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
                      )}
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
                {isActive && (
                  <tr className="bg-neutral-50/60 dark:bg-neutral-900/40">
                    <td colSpan={8} className="px-4 py-3">
                      {runProgress ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            {runProgress.itemCount} anuncios extraídos hasta ahora en Apify
                          </p>
                          {runProgress.logTail.length > 0 && (
                            <pre className="max-h-32 overflow-y-auto rounded-md bg-neutral-900 px-3 py-2 text-[11px] leading-relaxed text-neutral-300">
                              {runProgress.logTail.join("\n")}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">
                          Consultando progreso en Apify…
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
