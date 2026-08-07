"use client";

import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Lead } from "../../../lib/types";
import { ConfirmActionButton } from "../ConfirmActionButton";
import { FeatureBadges } from "../FeatureBadges";
import { IconButton } from "../IconButton";
import { StatusBadge } from "../leads/StatusBadge";
import { PropertyCard } from "./PropertyCard";
import { PropertyDetailModal } from "./PropertyDetailModal";

export function PropertyResults({ leads, view }: { leads: Lead[]; view: "cards" | "list" }) {
  const [items, setItems] = useState(leads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((lead) => lead.id === selectedId) ?? null;

  async function handleDelete(id: string) {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((lead) => lead.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    }
  }

  if (view === "cards") {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((lead) => (
            <div key={lead.id} className="relative">
              <PropertyCard lead={lead} />
              <div className="absolute right-2 top-2 flex gap-1">
                <IconButton icon={Eye} label="Ver detalle" onClick={() => setSelectedId(lead.id)} />
                <ConfirmActionButton
                  icon={Trash2}
                  label="Eliminar"
                  variant="danger"
                  confirmMessage={`¿Eliminar la propiedad "${lead.address ?? lead.id}"?`}
                  onConfirm={() => handleDelete(lead.id)}
                />
              </div>
            </div>
          ))}
        </div>
        {selected && <PropertyDetailModal lead={selected} onClose={() => setSelectedId(null)} />}
      </>
    );
  }

  return (
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
              <th className="table-head-cell" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {items.map((lead) => (
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
                <td className="table-cell text-neutral-500 dark:text-neutral-500">{lead.owner_name ?? "—"}</td>
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <IconButton icon={Eye} label="Ver detalle" onClick={() => setSelectedId(lead.id)} />
                    <ConfirmActionButton
                      icon={Trash2}
                      label="Eliminar"
                      variant="danger"
                      confirmMessage={`¿Eliminar la propiedad "${lead.address ?? lead.id}"?`}
                      onConfirm={() => handleDelete(lead.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <PropertyDetailModal lead={selected} onClose={() => setSelectedId(null)} />}
    </>
  );
}
