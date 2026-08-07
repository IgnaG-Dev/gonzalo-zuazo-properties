"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Lead } from "../../../lib/types";
import { ConfirmActionButton } from "../ConfirmActionButton";
import { StatusBadge } from "./StatusBadge";

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((lead) => lead.id !== id));
    }
  }

  return (
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
              <td className="table-cell text-right">
                <ConfirmActionButton
                  icon={Trash2}
                  label="Eliminar"
                  variant="danger"
                  confirmMessage={`¿Eliminar el lead "${lead.address ?? lead.id}"?`}
                  onConfirm={() => handleDelete(lead.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
