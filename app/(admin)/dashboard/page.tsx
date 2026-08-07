import { ArrowRight, Building2, CalendarCheck2, PhoneOff, RefreshCw, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import type { LeadStatus, ScrapeRunStatus } from "../../../lib/types";
import { Badge, type BadgeTone } from "../Badge";
import { StatusBadge } from "../leads/StatusBadge";

const LEAD_STATUSES: LeadStatus[] = ["nuevo lead", "en duda", "interesado", "no interesado"];

const SCRAPE_STATUS_TONES: Record<ScrapeRunStatus, BadgeTone> = {
  pending: "neutral",
  running: "info",
  succeeded: "success",
  failed: "danger",
  aborted: "danger",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    leadsTotalRes,
    nuevoRes,
    enDudaRes,
    interesadoRes,
    noInteresadoRes,
    meetingsRes,
    dncRes,
    scrapeTotalRes,
    scrapeSucceededRes,
    scrapeFailedRes,
    recentLeadsRes,
    recentRunsRes,
    ownerPhonesRes,
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "nuevo lead"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "en duda"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "interesado"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "no interesado"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("meeting_requested", true),
    supabase.from("do_not_call").select("*", { count: "exact", head: true }),
    supabase.from("scrape_runs").select("*", { count: "exact", head: true }),
    supabase.from("scrape_runs").select("*", { count: "exact", head: true }).eq("status", "succeeded"),
    supabase.from("scrape_runs").select("*", { count: "exact", head: true }).eq("status", "failed"),
    supabase
      .from("leads")
      .select("id, address, owner_name, status, price, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("scrape_runs").select("*").order("created_at", { ascending: false }).limit(5),
    // Mismo criterio que /usuarios: propietarios distintos = teléfonos distintos entre los leads.
    supabase.from("leads").select("phone_e164").not("phone_e164", "is", null).limit(5000),
  ]);

  const leadsTotal = leadsTotalRes.count ?? 0;
  const statusCounts: Record<LeadStatus, number> = {
    "nuevo lead": nuevoRes.count ?? 0,
    "en duda": enDudaRes.count ?? 0,
    interesado: interesadoRes.count ?? 0,
    "no interesado": noInteresadoRes.count ?? 0,
  };
  const meetingsCount = meetingsRes.count ?? 0;
  const dncTotal = dncRes.count ?? 0;
  const scrapeTotal = scrapeTotalRes.count ?? 0;
  const scrapeSucceeded = scrapeSucceededRes.count ?? 0;
  const scrapeFailed = scrapeFailedRes.count ?? 0;
  const recentLeads = recentLeadsRes.data ?? [];
  const recentRuns = recentRunsRes.data ?? [];
  const ownersCount = new Set((ownerPhonesRes.data ?? []).map((row) => row.phone_e164)).size;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Resumen general de leads, propietarios y corridas de scrape.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Building2} label="Propiedades captadas" value={leadsTotal} href="/inmobiliarios" />
        <StatCard icon={Users} label="Propietarios" value={ownersCount} href="/usuarios" />
        <StatCard icon={CalendarCheck2} label="Reuniones solicitadas" value={meetingsCount} href="/leads" />
        <StatCard
          icon={RefreshCw}
          label="Corridas de scrape (OK)"
          value={`${scrapeSucceeded}/${scrapeTotal}`}
          href="/scrapes"
        />
        <StatCard icon={PhoneOff} label="Lista de exclusión" value={dncTotal} href="/dnc" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Leads por estado</h2>
          <div className="flex flex-col gap-3">
            {LEAD_STATUSES.map((status) => {
              const value = statusCounts[status];
              const pct = leadsTotal > 0 ? Math.round((value / leadsTotal) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <StatusBadge status={status} />
                    <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-accent-500 dark:bg-accent-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Últimas corridas de scrape
            </h2>
            <Link
              href="/scrapes"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent-700 hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
            >
              Ver todas <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          {recentRuns.length > 0 ? (
            <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {recentRuns.map((run) => (
                <li key={run.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {run.apify_run_id}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-600">
                      {new Date(run.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                  <Badge tone={SCRAPE_STATUS_TONES[run.status] ?? "neutral"}>{run.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-500">Todavía no se ejecutó ninguna corrida.</p>
          )}
          {scrapeFailed > 0 && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              {scrapeFailed} {scrapeFailed === 1 ? "corrida falló" : "corridas fallaron"} en total.
            </p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Últimos leads captados</h2>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent-700 hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
          >
            Ver todos <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
        {recentLeads.length > 0 ? (
          <ul className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <Link href={`/leads/${lead.id}`} className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 hover:text-accent-700 dark:text-neutral-100 dark:hover:text-accent-300">
                    {lead.address ?? "(sin dirección)"}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-500">
                    {lead.owner_name ?? "—"}
                    {lead.price != null ? ` · ${lead.price.toLocaleString("es-ES")} €` : ""}
                  </p>
                </Link>
                <StatusBadge status={lead.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Todavía no hay leads. Corré un scrape desde la sección Scrapes para empezar.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-4 p-5 transition-shadow duration-150 hover:shadow-md"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
        <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      </div>
    </Link>
  );
}
