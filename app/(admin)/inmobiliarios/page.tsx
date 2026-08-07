import { Search } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import { FeatureBadges } from "../FeatureBadges";
import { Pagination } from "../Pagination";
import { StatusBadge } from "../leads/StatusBadge";
import { ViewToggle } from "../ViewToggle";
import { PropertyCard } from "./PropertyCard";

const CARDS_PAGE_SIZE = 24;
const LIST_PAGE_SIZE = 25;
const ROOM_OPTIONS = [1, 2, 3, 4];
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Más recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

export default async function InmobiliariosPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; rooms?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const view = params.view === "list" ? "list" : "cards";
  const q = (params.q ?? "").trim();
  const rooms = params.rooms ?? "";
  const sort = params.sort ?? "newest";
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = view === "list" ? LIST_PAGE_SIZE : CARDS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase.from("leads").select("*", { count: "exact" }).range(from, to);

  if (sort === "price_asc") query = query.order("price", { ascending: true, nullsFirst: false });
  else if (sort === "price_desc") query = query.order("price", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  if (rooms) query = query.gte("rooms", Number(rooms));

  if (q) {
    const term = sanitizeSearchTerm(q);
    if (term) {
      query = query.or(`address.ilike.%${term}%,owner_name.ilike.%${term}%`);
    }
  }

  const { data: leads, error, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Inmobiliarios
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {count ?? 0} {count === 1 ? "propiedad" : "propiedades"} captadas.
          </p>
        </div>
        <ViewToggle
          basePath="/inmobiliarios"
          current={view}
          options={[
            { value: "cards", label: "Cards" },
            { value: "list", label: "Lista" },
          ]}
          searchParams={params}
        />
      </div>

      <form
        action="/inmobiliarios"
        method="GET"
        className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
      >
        {view === "list" && <input type="hidden" name="view" value="list" />}
        <div className="relative min-w-[220px] flex-1">
          <label className="field-label">Buscar</label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Dirección o propietario…"
              className="field-input pl-9"
            />
          </div>
        </div>
        <div>
          <label className="field-label">Habitaciones</label>
          <select name="rooms" defaultValue={rooms} className="field-input">
            <option value="">Cualquiera</option>
            {ROOM_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Ordenar por</label>
          <select name="sort" defaultValue={sort} className="field-input">
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-secondary">
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando propiedades: {error.message}
        </p>
      )}

      {leads?.length === 0 ? (
        <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            No hay propiedades que coincidan
          </p>
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
            Probá con otros filtros, o corré un scrape desde la sección Scrapes.
          </p>
        </div>
      ) : view === "cards" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(leads ?? []).map((lead) => (
              <PropertyCard key={lead.id} lead={lead} />
            ))}
          </div>
          <Pagination basePath="/inmobiliarios" currentPage={page} totalPages={totalPages} searchParams={params} />
        </>
      ) : (
        <>
          <div className="table-shell">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="table-head-cell">Dirección</th>
                  <th className="table-head-cell text-right">Precio</th>
                  <th className="table-head-cell text-right">m²</th>
                  <th className="table-head-cell text-right">Hab.</th>
                  <th className="table-head-cell">Features</th>
                  <th className="table-head-cell">Estado</th>
                  <th className="table-head-cell">Propietario</th>
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
                    </td>
                    <td className="table-cell text-right tabular-nums">
                      {lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "—"}
                    </td>
                    <td className="table-cell text-right tabular-nums">{lead.size_m2 ?? "—"}</td>
                    <td className="table-cell text-right tabular-nums">{lead.rooms ?? "—"}</td>
                    <td className="table-cell">
                      <FeatureBadges lead={lead} compact />
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="table-cell text-neutral-500 dark:text-neutral-500">
                      {lead.owner_name ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/inmobiliarios" currentPage={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}
