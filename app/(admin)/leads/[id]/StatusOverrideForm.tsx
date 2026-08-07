"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "../../../../lib/types";

const STATUS_OPTIONS: LeadStatus[] = ["nuevo lead", "en duda", "interesado", "no interesado"];

export function StatusOverrideForm({
  leadId,
  currentStatus,
  currentMeetingNotes,
}: {
  leadId: string;
  currentStatus: LeadStatus;
  currentMeetingNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [meetingNotes, setMeetingNotes] = useState(currentMeetingNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, meeting_notes: meetingNotes }),
    });

    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "error al guardar");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="field-label">Estado (override manual)</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
          className="field-input"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label">Notas de reunión</label>
        <textarea
          value={meetingNotes}
          onChange={(e) => setMeetingNotes(e.target.value)}
          rows={3}
          className="field-input resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary w-fit">
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
