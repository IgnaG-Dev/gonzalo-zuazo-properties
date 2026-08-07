import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import { Pagination } from "../Pagination";
import { SearchForm } from "../SearchForm";
import { OwnersTable } from "./OwnersTable";
import type { Owner } from "./types";

const PAGE_SIZE = 25;
const FETCH_CAP = 2000;

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const [{ data: leads, error }, { data: dncEntries }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, owner_name, phone_raw, phone_e164, seller_type, created_at")
      .order("created_at", { ascending: false })
      .limit(FETCH_CAP),
    supabase.from("do_not_call").select("phone_e164"),
  ]);

  const dncSet = new Set((dncEntries ?? []).map((entry) => entry.phone_e164));

  const ownersByKey = new Map<string, Owner>();
  for (const lead of leads ?? []) {
    const key = lead.phone_e164 ?? `no-phone-${lead.id}`;
    const existing = ownersByKey.get(key);
    if (existing) {
      existing.propertyCount += 1;
      if (lead.created_at > existing.lastActivity) existing.lastActivity = lead.created_at;
      if (!existing.ownerName && lead.owner_name) existing.ownerName = lead.owner_name;
    } else {
      ownersByKey.set(key, {
        key,
        ownerName: lead.owner_name,
        phoneE164: lead.phone_e164,
        phoneRaw: lead.phone_raw,
        sellerType: lead.seller_type,
        propertyCount: 1,
        lastActivity: lead.created_at,
        inDnc: lead.phone_e164 ? dncSet.has(lead.phone_e164) : false,
      });
    }
  }

  let owners = Array.from(ownersByKey.values()).sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1));

  if (q) {
    const term = sanitizeSearchTerm(q).toLowerCase();
    if (term) {
      owners = owners.filter(
        (owner) =>
          owner.ownerName?.toLowerCase().includes(term) ||
          owner.phoneE164?.toLowerCase().includes(term) ||
          owner.phoneRaw?.toLowerCase().includes(term)
      );
    }
  }

  const totalPages = Math.max(1, Math.ceil(owners.length / PAGE_SIZE));
  const pageOwners = owners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {owners.length} {owners.length === 1 ? "propietario" : "propietarios"} distintos, agrupados por
            teléfono.
          </p>
        </div>
        <SearchForm basePath="/usuarios" q={q} placeholder="Buscar por nombre o teléfono…" />
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          Error cargando usuarios: {error.message}
        </p>
      )}

      {pageOwners.length === 0 ? (
        <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {q ? "No hay usuarios que coincidan" : "Todavía no hay usuarios"}
          </p>
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
            {q ? "Probá con otra búsqueda." : "Los propietarios aparecen acá a medida que se captan leads."}
          </p>
        </div>
      ) : (
        <>
          <OwnersTable key={`${q}-${page}`} owners={pageOwners} />
          <Pagination basePath="/usuarios" currentPage={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}
