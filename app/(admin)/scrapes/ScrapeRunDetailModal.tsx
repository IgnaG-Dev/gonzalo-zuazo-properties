"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ScrapeRun } from "../../../lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  running: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
  succeeded: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  aborted: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ACTIVE_STATUSES = new Set(["pending", "running"]);

interface ApifyProgress {
  itemCount: number;
  logTail: string[];
}

export function ScrapeRunDetailModal({ run, onClose }: { run: ScrapeRun; onClose: () => void }) {
  const [progress, setProgress] = useState<ApifyProgress | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const isActive = ACTIVE_STATUSES.has(run.status);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Progreso real de Apify: se pide siempre al abrir (útil aunque la corrida
  // ya haya terminado, si Apify todavía retiene el dataset/log), y se sigue
  // consultando mientras esté activa.
  useEffect(() => {
    let cancelled = false;

    async function fetchProgress() {
      try {
        const res = await fetch(`/api/scrapes/${run.apify_run_id}/progress`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setProgressError(body.error ?? "no se pudo consultar Apify");
          return;
        }
        const data = (await res.json()) as { itemCount: number; logTail: string[] };
        if (!cancelled) {
          setProgress({ itemCount: data.itemCount, logTail: data.logTail });
          setProgressError(null);
        }
      } catch {
        if (!cancelled) setProgressError("no se pudo consultar Apify");
      }
    }

    fetchProgress();
    const interval = isActive ? setInterval(fetchProgress, 4000) : undefined;
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [run.apify_run_id, isActive]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de la corrida"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] dark:border-neutral-800/80 dark:bg-neutral-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{run.apify_run_id}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                STATUS_STYLES[run.status] ?? STATUS_STYLES.pending
              }`}
            >
              {isActive && <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
              {run.status}
            </span>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="btn-ghost !px-2">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Creados</dt>
            <dd className="tabular-nums text-neutral-900 dark:text-neutral-100">{run.leads_created}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Actualizados</dt>
            <dd className="tabular-nums text-neutral-900 dark:text-neutral-100">{run.leads_updated}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Agencias omitidas</dt>
            <dd className="tabular-nums text-neutral-900 dark:text-neutral-100">{run.leads_skipped_agency}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Inválidos</dt>
            <dd className="tabular-nums text-neutral-900 dark:text-neutral-100">{run.leads_skipped_invalid}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Iniciada</dt>
            <dd className="text-neutral-900 dark:text-neutral-100">
              {run.started_at ? new Date(run.started_at).toLocaleString("es-ES") : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500 dark:text-neutral-500">Finalizada</dt>
            <dd className="text-neutral-900 dark:text-neutral-100">
              {run.finished_at ? new Date(run.finished_at).toLocaleString("es-ES") : "—"}
            </dd>
          </div>
        </dl>

        {run.error_message && (
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">Error</p>
            <p className="mt-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {run.error_message}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">Progreso en Apify</p>
          {progressError ? (
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">{progressError}</p>
          ) : progress ? (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {progress.itemCount} anuncios {isActive ? "extraídos hasta ahora" : "extraídos en total"}
              </p>
              {progress.logTail.length > 0 && (
                <pre className="max-h-48 overflow-y-auto rounded-md bg-neutral-900 px-3 py-2 text-[11px] leading-relaxed text-neutral-300">
                  {progress.logTail.join("\n")}
                </pre>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-600">Consultando…</p>
          )}
        </div>
      </div>
    </div>
  );
}
