"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Settings } from "../../../lib/types";

const SINCE_DATE_OPTIONS: { value: "" | "Y" | "W" | "M"; label: string }[] = [
  { value: "Y", label: "Últimas 48h (recomendado si scrapeás seguido)" },
  { value: "W", label: "Última semana" },
  { value: "M", label: "Último mes" },
  { value: "", label: "Cualquier momento (más caro, más duplicados)" },
];

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    is_scraping_enabled: settings.is_scraping_enabled,
    scrape_location_id: settings.scrape_location_id ?? "",
    scrape_location_name: settings.scrape_location_name ?? "",
    scrape_num_pages: settings.scrape_num_pages,
    scrape_since_date: settings.scrape_since_date,
    scrape_schedule_cron: settings.scrape_schedule_cron,
    is_dialing_enabled: settings.is_dialing_enabled,
    dial_schedule_cron: settings.dial_schedule_cron,
    calling_hours_start: settings.calling_hours_start.slice(0, 5),
    calling_hours_end: settings.calling_hours_end.slice(0, 5),
    calling_days: settings.calling_days,
    timezone: settings.timezone,
    max_call_attempts: settings.max_call_attempts,
    min_hours_between_attempts: settings.min_hours_between_attempts,
    retell_agent_id: settings.retell_agent_id ?? "",
    retell_from_number: settings.retell_from_number ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      calling_days: prev.calling_days.includes(day)
        ? prev.calling_days.filter((d) => d !== day)
        : [...prev.calling_days, day].sort(),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "error al guardar");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="card p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Scraping (Apify)
        </h2>
        <div className="flex flex-col gap-5">
          <Checkbox
            label="Scraping automático activado"
            checked={form.is_scraping_enabled}
            onChange={(v) => setForm((p) => ({ ...p, is_scraping_enabled: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Location ID (Idealista)"
              value={form.scrape_location_id}
              onChange={(v) => setForm((p) => ({ ...p, scrape_location_id: v }))}
            />
            <TextField
              label="Location name"
              value={form.scrape_location_name}
              onChange={(v) => setForm((p) => ({ ...p, scrape_location_name: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Páginas por corrida (40 props/página, ~30 facturadas)"
              type="number"
              value={String(form.scrape_num_pages)}
              onChange={(v) => setForm((p) => ({ ...p, scrape_num_pages: Number(v) }))}
            />
            <div>
              <label className="field-label">Publicado desde</label>
              <select
                value={form.scrape_since_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scrape_since_date: e.target.value as typeof p.scrape_since_date }))
                }
                className="field-input"
              >
                {SINCE_DATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            Apify cobra $0.003 por propiedad devuelta, aunque ya la tengas. &ldquo;Publicado
            desde&rdquo; es lo que evita re-pagar por todo el listado en cada corrida — el upsert
            por código de Idealista además garantiza que nunca se dupliquen filas en la base.
          </p>
          <TextField
            label="Cron de scraping"
            value={form.scrape_schedule_cron}
            onChange={(v) => setForm((p) => ({ ...p, scrape_schedule_cron: v }))}
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Llamadas (Retell)
        </h2>
        <div className="flex flex-col gap-5">
          <Checkbox
            label="Llamadas automáticas activadas"
            checked={form.is_dialing_enabled}
            onChange={(v) => setForm((p) => ({ ...p, is_dialing_enabled: v }))}
          />
          <TextField
            label="Cron de marcado"
            value={form.dial_schedule_cron}
            onChange={(v) => setForm((p) => ({ ...p, dial_schedule_cron: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Hora inicio"
              type="time"
              value={form.calling_hours_start}
              onChange={(v) => setForm((p) => ({ ...p, calling_hours_start: v }))}
            />
            <TextField
              label="Hora fin"
              type="time"
              value={form.calling_hours_end}
              onChange={(v) => setForm((p) => ({ ...p, calling_hours_end: v }))}
            />
          </div>
          <div>
            <label className="field-label">Días de llamada</label>
            <div className="flex gap-1.5">
              {WEEKDAYS.map((day) => {
                const active = form.calling_days.includes(day.value);
                return (
                  <button
                    type="button"
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    aria-pressed={active}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                      active
                        ? "border-accent-600 bg-accent-600 text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <TextField
            label="Zona horaria"
            value={form.timezone}
            onChange={(v) => setForm((p) => ({ ...p, timezone: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Máx. intentos por lead"
              type="number"
              value={String(form.max_call_attempts)}
              onChange={(v) => setForm((p) => ({ ...p, max_call_attempts: Number(v) }))}
            />
            <TextField
              label="Horas mínimas entre intentos"
              type="number"
              value={String(form.min_hours_between_attempts)}
              onChange={(v) => setForm((p) => ({ ...p, min_hours_between_attempts: Number(v) }))}
            />
          </div>
          <TextField
            label="Retell agent ID"
            value={form.retell_agent_id}
            onChange={(v) => setForm((p) => ({ ...p, retell_agent_id: v }))}
          />
          <div>
            <TextField
              label="Retell from number"
              value={form.retell_from_number}
              onChange={(v) => setForm((p) => ({ ...p, retell_from_number: v }))}
            />
            <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
              Por ahora solo hay un número de pruebas (destinos EE. UU.). Para llamar a números
              españoles en producción hace falta importar un número vía Twilio + SIP trunk — paso
              de configuración de cuenta en Retell, no de código.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Guardando…" : "Guardar configuración"}
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && !error && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">Guardado.</p>
        )}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field-input" />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="field-checkbox"
      />
      {label}
    </label>
  );
}
