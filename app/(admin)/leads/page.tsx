import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import type { LeadStatus } from "../../../lib/types";
import { Pagination } from "../Pagination";
import { SearchForm } from "../SearchForm";
import { ViewToggle } from "../ViewToggle";
import { KanbanBoard } from "./KanbanBoard";
import { StatusBadge } from "./StatusBadge";

const STATUS_TABS: { value: LeadStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "nuevo lead", label: "Nuevo lead" },
  { value: "en duda", label: "En duda" },
  { value: "interesado", label: "Interesado" },
  { value: "no interesado", label: "No interesado" },
];

const LEAD_STATUSES: LeadStatus[] = ["nuevo lead", "en duda", "interesado", "no interesado"];
const PAGE_SIZE = 25;

function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as string[]).includes(value);
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "kanban";
  const q = (params.q ?? "").trim();
  const supabase = await createClient();

  if (view === "kanban") {
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500);

    if (q) {
      const term = sanitizeSearchTerm(q);
      if (term) {
        query = query.or(`address.ilike.%${term}%,owner_name.ilike.%${term}%,phone_e164.ilike.%${term}%`);
      }
    }

    const { data: leads, error } = await query;

    return (
      <div>
        <Header view={view} q={q} status="todos" searchParams={params} />
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">Error cargando leads: {error.message}</p>
        )}
        <KanbanBoard leads={leads ?? []} />
      </div>
    );
  }

  // Vista lista
  const status = params.status ?? "todos";
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "todos" && isLeadStatus(status)) {
    query = query.eq("status", status);
  }
  if (q) {
    const term = sanitizeSearchTerm(q);
    if (term) {
      query = query.or(`address.ilike.%${term}%,owner_name.ilike.%${term}%,phone_e164.ilike.%${term}%`);
    }
  }

  const { data: leads, error, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <Header view={view} q={q} status={status} searchParams={params} />

      <div className="mb-5 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          const href = buildListHref({ ...params, status: tab.value === "todos" ? undefined : tab.value, page: undefined });
          return (
            <Link
              key={tab.value}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "text-accent-700 dark:text-accent-300"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-600 dark:bg-accent-400" />
              )}
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">Error cargando leads: {error.message}</p>
      )}

      {leads?.length === 0 ? (
        <EmptyState status={status} hasQuery={Boolean(q)} />
      ) : (
        <>
          <div className="table-shell">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="table-head-cell">Dirección</th>
                  <th className="table-head-cell text-right">Precio</th>
                  <th className="table-head-cell">Teléfono</th>
                  <th className="table-head-cell">Estado</th>
                  <th className="table-head-cell text-right">Intentos</th>
                  <th className="table-head-cell">Reunión</th>
                  <th className="table-head-cell">Actualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {(leads ?? []).map((lead) => (
                  <tr key={lead.id} className="table-row">
                    <td className="table-cell">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium text-neutral-900 hover:text-accent-700 dark:text-neutral-100 dark:hover:text-accent-300"
                      >
                        {lead.address ?? "(sin dirección)"}
                      </Link>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">{lead.owner_name ?? "—"}</p>
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "—"}
                    </td>
                    <td className="table-cell tabular-nums">
                      {lead.phone_e164 ?? <span className="text-neutral-400 dark:text-neutral-600">sin teléfono</span>}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="table-cell text-right tabular-nums">{lead.call_attempts}</td>
                    <td className="table-cell">
                      {lead.meeting_requested ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Sí</span>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="table-cell text-neutral-500 dark:text-neutral-500">
                      {new Date(lead.updated_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/leads" currentPage={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}

function Header({
  view,
  q,
  status,
  searchParams,
}: {
  view: string;
  q: string;
  status: string;
  searchParams: Record<string, string | undefined>;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Leads</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Pipeline de calificación y llamadas.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchForm
          basePath="/leads"
          q={q}
          placeholder="Buscar por dirección, dueño o teléfono…"
          hidden={{ view: view === "kanban" ? undefined : view, status: status === "todos" ? undefined : status }}
        />
        <ViewToggle
          basePath="/leads"
          current={view}
          options={[
            { value: "kanban", label: "Kanban" },
            { value: "list", label: "Lista" },
          ]}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}

function EmptyState({ status, hasQuery }: { status: string; hasQuery: boolean }) {
  const isFiltered = status !== "todos" || hasQuery;
  return (
    <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {isFiltered ? "No hay leads que coincidan" : "Todavía no hay leads"}
      </p>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
        {isFiltered
          ? "Probá con otro filtro o búsqueda."
          : "Corré un scrape desde la sección Scrapes para empezar a captar anuncios de Idealista."}
      </p>
      {!isFiltered && (
        <Link href="/scrapes" className="btn-primary mt-4">
          Ir a Scrapes
        </Link>
      )}
    </div>
  );
}

function buildListHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `/leads?${qs}` : "/leads";
}
