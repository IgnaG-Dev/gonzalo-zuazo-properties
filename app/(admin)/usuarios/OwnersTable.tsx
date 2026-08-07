"use client";

import { Eye, PhoneOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmActionButton } from "../ConfirmActionButton";
import { IconButton } from "../IconButton";
import { OwnerDetailModal } from "./OwnerDetailModal";
import type { Owner } from "./types";

export function OwnersTable({ owners }: { owners: Owner[] }) {
  const [items, setItems] = useState(owners);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = items.find((owner) => owner.key === selectedKey) ?? null;

  async function handleExclude(owner: Owner) {
    if (!owner.phoneE164) return;

    const res = await fetch("/api/dnc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: owner.phoneE164, reason: "Excluido desde Usuarios" }),
    });

    if (res.ok) {
      setItems((prev) => prev.map((o) => (o.key === owner.key ? { ...o, inDnc: true } : o)));
    }
  }

  return (
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
            {items.map((owner) => (
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
                <td className="table-cell text-neutral-500 dark:text-neutral-500">{owner.sellerType ?? "—"}</td>
                <td className="table-cell text-right tabular-nums">{owner.propertyCount}</td>
                <td className="table-cell text-neutral-500 dark:text-neutral-500">
                  {new Date(owner.lastActivity).toLocaleDateString("es-ES")}
                </td>
                <td className="table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/leads?view=list&q=${encodeURIComponent(owner.phoneE164 ?? owner.ownerName ?? "")}`}
                      className="mr-1 text-xs font-medium text-accent-700 hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
                    >
                      Ver leads →
                    </Link>
                    <IconButton icon={Eye} label="Ver detalle" onClick={() => setSelectedKey(owner.key)} />
                    <ConfirmActionButton
                      icon={PhoneOff}
                      label="Excluir"
                      confirmMessage={`¿Agregar a "${owner.ownerName ?? owner.phoneE164 ?? "este propietario"}" a la lista de exclusión?`}
                      disabled={!owner.phoneE164 || owner.inDnc}
                      onConfirm={() => handleExclude(owner)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <OwnerDetailModal owner={selected} onClose={() => setSelectedKey(null)} />}
    </>
  );
}
