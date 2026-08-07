import { PhoneOff } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/server";
import { sanitizeSearchTerm } from "../../../lib/search";
import { Pagination } from "../Pagination";
import { SearchForm } from "../SearchForm";

const PAGE_SIZE = 25;
const FETCH_CAP = 2000;

interface Owner {
  key: string;
  ownerName: string | null;
  phoneE164: string | null;
  phoneRaw: string | null;
  sellerType: string | null;
  propertyCount: number;
  lastActivity: string;
  inDnc: boolean;
}

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
          <div className="table-shell">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="table-head-cell">Nombre</th>
                  <th className="table-head-cell">Teléfono</th>
                  <th className="table-head-cell">Tipo</th>
                  <th className="table-head-cell text-right">Propiedades</th>
                  <th className="table-head-cell">Última actividad</th>
                  <th className="table-head-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {pageOwners.map((owner) => (
                  <tr key={owner.key} className="table-row">
                    <td className="table-cell font-medium text-neutral-900 dark:text-neutral-100">
                      {owner.ownerName ?? "Sin nombre"}
                    </td>
                    <td className="table-cell tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        {owner.phoneE164 ?? owner.phoneRaw ?? (
                          <span className="text-neutral-400 dark:text-neutral-600">sin teléfono</span>
                        )}
                        {owner.inDnc && (
                          <span
                            title="En lista de exclusión"
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          >
                            <PhoneOff className="size-3" strokeWidth={2} />
                            DNC
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="table-cell text-neutral-500 dark:text-neutral-500">
                      {owner.sellerType ?? "—"}
                    </td>
                    <td className="table-cell text-right tabular-nums">{owner.propertyCount}</td>
                    <td className="table-cell text-neutral-500 dark:text-neutral-500">
                      {new Date(owner.lastActivity).toLocaleDateString("es-ES")}
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/leads?view=list&q=${encodeURIComponent(owner.phoneE164 ?? owner.ownerName ?? "")}`}
                        className="text-xs font-medium text-accent-700 hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
                      >
                        Ver leads →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination basePath="/usuarios" currentPage={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}
