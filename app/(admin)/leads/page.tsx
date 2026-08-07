import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import type { LeadStatus } from "../../../lib/types";
import { Pagination } from "../Pagination";
import { SearchForm } from "../SearchForm";
import { Tabs } from "../Tabs";
import { ViewToggle } from "../ViewToggle";
import { KanbanBoard } from "./KanbanBoard";
import { LeadsTable } from "./LeadsTable";

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
        <KanbanBoard key={q} leads={leads ?? []} />
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

      <Tabs basePath="/leads" paramName="status" current={status} options={STATUS_TABS} searchParams={params} />

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">Error cargando leads: {error.message}</p>
      )}

      {leads?.length === 0 ? (
        <EmptyState status={status} hasQuery={Boolean(q)} />
      ) : (
        <>
          <LeadsTable key={`${status}-${q}-${page}`} leads={leads ?? []} />
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
