import { Check, CircleDashed, Loader2, X } from "lucide-react";
import type { ScrapeRunStatus } from "../../../lib/types";

type StepState = "done" | "active" | "pending" | "error";

interface StepDef {
  key: string;
  label: string;
  state: StepState;
  detail?: string;
}

const APIFY_TERMINAL = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"]);
const APIFY_BAD = new Set(["FAILED", "ABORTED", "TIMED-OUT", "TIMED_OUT"]);

/**
 * Checklist de pasos de una corrida, derivado de señales reales (no
 * inventadas): el estado real de la corrida en Apify, la cantidad real de
 * anuncios en el dataset, y el texto real del log del actor.
 */
export function ScrapeStepChecklist({
  dbStatus,
  apifyStatus,
  itemCount,
  logTail,
}: {
  dbStatus: ScrapeRunStatus;
  apifyStatus?: string;
  itemCount?: number;
  logTail: string[];
}) {
  const isDbTerminal = dbStatus !== "pending" && dbStatus !== "running";
  const dbFailed = dbStatus === "failed" || dbStatus === "aborted";
  const apifyDone = apifyStatus ? APIFY_TERMINAL.has(apifyStatus) : false;
  const apifyBad = apifyStatus ? APIFY_BAD.has(apifyStatus) : false;

  const reportDone = logTail.some((line) => /report generated|generated successfully/i.test(line));
  const reportActive = !reportDone && logTail.some((line) => /generating.*report/i.test(line));

  const steps: StepDef[] = [
    { key: "start", label: "Corrida iniciada en Apify", state: "done" },
    {
      key: "scrape",
      label: "Escaneando Idealista y extrayendo anuncios",
      state: apifyBad ? "error" : apifyDone ? "done" : apifyStatus ? "active" : "pending",
      detail: itemCount != null ? `${itemCount} anuncios extraídos hasta ahora` : undefined,
    },
  ];

  if (reportDone || reportActive) {
    steps.push({
      key: "report",
      label: "Generando reporte del actor",
      state: reportDone ? "done" : "active",
    });
  }

  steps.push(
    {
      key: "save",
      label: "Guardando anuncios en la base de datos",
      state: isDbTerminal ? (dbFailed ? "error" : "done") : apifyDone ? "active" : "pending",
    },
    {
      key: "finish",
      label: dbStatus === "failed" ? "Corrida fallida" : dbStatus === "aborted" ? "Corrida abortada" : "Completado",
      state: isDbTerminal ? (dbFailed ? "error" : "done") : "pending",
    }
  );

  return (
    <div className="flex flex-col gap-2">
      {steps.map((step) => (
        <div key={step.key} className="flex items-start gap-2">
          <StepIcon state={step.state} />
          <div>
            <p
              className={`text-xs font-medium ${
                step.state === "done"
                  ? "text-neutral-700 dark:text-neutral-300"
                  : step.state === "active"
                    ? "text-accent-700 dark:text-accent-300"
                    : step.state === "error"
                      ? "text-red-600 dark:text-red-400"
                      : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              {step.label}
            </p>
            {step.detail && <p className="text-[11px] text-neutral-500 dark:text-neutral-500">{step.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === "active") {
    return <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-accent-600 dark:text-accent-400" strokeWidth={2.5} />;
  }
  if (state === "error") {
    return (
      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
        <X className="size-2.5" strokeWidth={3} />
      </span>
    );
  }
  return <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-neutral-300 dark:text-neutral-700" strokeWidth={2} />;
}
