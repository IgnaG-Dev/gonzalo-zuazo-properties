import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import { Pagination } from "../Pagination";
import { SearchForm } from "../SearchForm";
import { DncManager } from "./DncManager";

const PAGE_SIZE = 25;

export default async function DncPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  let query = supabase
    .from("do_not_call")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    const term = sanitizeSearchTerm(q);
    if (term) {
      query = query.or(`phone_e164.ilike.%${term}%,reason.ilike.%${term}%`);
    }
  }

  const { data: entries, error, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Lista de exclusión
          </h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">
            Cubre solo bloqueos manuales o detectados por el propio sistema (ej. el propietario pidió
            no volver a llamar durante la llamada). No es una integración con la Lista Robinson
            oficial.
          </p>
        </div>
        <SearchForm basePath="/dnc" q={q} placeholder="Buscar por teléfono o motivo…" />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando lista: {error.message}
        </p>
      )}

      <DncManager entries={entries ?? []} hasQuery={Boolean(q)} />
      <Pagination basePath="/dnc" currentPage={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
