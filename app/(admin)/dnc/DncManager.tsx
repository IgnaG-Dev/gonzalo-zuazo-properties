"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DoNotCallEntry } from "../../../lib/types";
import { ConfirmActionButton } from "../ConfirmActionButton";

export function DncManager({ entries, hasQuery }: { entries: DoNotCallEntry[]; hasQuery?: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/dnc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, reason }),
    });

    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "error al añadir");
      return;
    }

    setPhone("");
    setReason("");
    router.refresh();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/dnc?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleAdd} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[160px]">
          <label className="field-label">Teléfono</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="600123456"
            className="field-input"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="field-label">Motivo</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Solicitado por el propietario"
            className="field-input"
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Añadiendo…" : "Añadir"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {entries.length === 0 ? (
        <div className="card flex flex-col items-center gap-1 px-6 py-16 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {hasQuery ? "No hay números que coincidan" : "Lista vacía"}
          </p>
          <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-500">
            {hasQuery
              ? "Probá con otra búsqueda."
              : "Los números que agregués acá quedan excluidos de futuras llamadas automáticas."}
          </p>
        </div>
      ) : (
        <div className="table-shell">
          <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="table-head-cell">Teléfono</th>
                <th className="table-head-cell">Motivo</th>
                <th className="table-head-cell">Añadido</th>
                <th className="table-head-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {entries.map((entry) => (
                <tr key={entry.id} className="table-row">
                  <td className="table-cell font-mono tabular-nums">{entry.phone_e164}</td>
                  <td className="table-cell">{entry.reason ?? "—"}</td>
                  <td className="table-cell text-neutral-500 dark:text-neutral-500">
                    {new Date(entry.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="table-cell text-right">
                    <ConfirmActionButton
                      icon={Trash2}
                      label="Quitar"
                      variant="danger"
                      confirmMessage={`¿Quitar "${entry.phone_e164}" de la lista de exclusión?`}
                      onConfirm={() => handleRemove(entry.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
