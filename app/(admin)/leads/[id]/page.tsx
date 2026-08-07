import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { FeatureBadges } from "../../FeatureBadges";
import { StatusBadge } from "../StatusBadge";
import { DeleteLeadButton } from "./DeleteLeadButton";
import { StatusOverrideForm } from "./StatusOverrideForm";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead }, { data: callLogs }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("call_logs")
      .select("*")
      .eq("lead_id", id)
      .order("attempt_number", { ascending: true }),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/leads"
        className="inline-flex w-fit items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        ← Volver a leads
      </Link>

      {lead.photos.length > 0 && <PhotoStrip photos={lead.photos} address={lead.address} />}

      <div className="card flex items-start justify-between gap-6 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {lead.address ?? "(sin dirección)"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {lead.owner_name ?? "Propietario desconocido"}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <Field label="Precio" value={lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "—"} />
            <Field label="Tamaño" value={lead.size_m2 != null ? `${lead.size_m2} m²` : "—"} />
            <Field label="Habitaciones" value={lead.rooms ?? "—"} />
            <Field label="Baños" value={lead.bathrooms ?? "—"} />
            <Field label="Planta" value={lead.floor ?? "—"} />
            <Field label="Tipo" value={lead.property_type ?? "—"} />
            <Field label="Teléfono" value={lead.phone_e164 ?? "sin normalizar"} />
            <Field label="Vendedor" value={lead.seller_type ?? "—"} />
          </dl>

          <div className="mt-4">
            <FeatureBadges lead={lead} />
          </div>

          {lead.description && (
            <details className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              <summary className="cursor-pointer font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
                Ver descripción del anuncio
              </summary>
              <p className="mt-2 max-w-2xl leading-relaxed whitespace-pre-wrap">{lead.description}</p>
            </details>
          )}

          {lead.source_url && (
            <a
              href={lead.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-700 transition-colors hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
            >
              Ver anuncio en Idealista →
            </a>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            <DeleteLeadButton leadId={lead.id} address={lead.address} />
          </div>
          <span className="text-right text-xs text-neutral-500 dark:text-neutral-500">
            {lead.call_attempts} intento(s)
            <br />
            último: {lead.last_call_at ? new Date(lead.last_call_at).toLocaleString("es-ES") : "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Historial de llamadas
          </h2>
          <div className="flex flex-col gap-3">
            {(callLogs ?? []).map((log) => (
              <div key={log.id} className="card p-4">
                <div className="mb-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    Intento #{log.attempt_number}
                  </span>
                  <span className="tabular-nums text-neutral-500 dark:text-neutral-500">
                    {log.started_at ? new Date(log.started_at).toLocaleString("es-ES") : "—"}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {log.call_successful !== null && <span>Exitosa: {log.call_successful ? "sí" : "no"}</span>}
                  {log.user_sentiment && <span>Sentimiento: {log.user_sentiment}</span>}
                  {log.resulting_status && <span>Resultado: {log.resulting_status}</span>}
                </div>
                {log.recording_url && (
                  <audio controls src={log.recording_url} className="mb-2 w-full">
                    Tu navegador no soporta audio.
                  </audio>
                )}
                {log.transcript && (
                  <details className="text-sm text-neutral-600 dark:text-neutral-400">
                    <summary className="cursor-pointer font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
                      Ver transcript
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed">{log.transcript}</p>
                  </details>
                )}
              </div>
            ))}
            {callLogs?.length === 0 && (
              <div className="card px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-500">
                Todavía no se ha llamado a este lead.
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Override manual
          </h2>
          <div className="card p-4">
            <StatusOverrideForm
              leadId={lead.id}
              currentStatus={lead.status}
              currentMeetingNotes={lead.meeting_notes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoStrip({ photos, address }: { photos: string[]; address: string | null }) {
  const visible = photos.slice(0, 8);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {visible.map((url, i) => (
        <div key={url} className="relative h-40 w-56 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800">
          <Image
            src={url}
            alt={address ? `${address} — foto ${i + 1}` : `Foto ${i + 1}`}
            fill
            sizes="224px"
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500 dark:text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-800 dark:text-neutral-200">{value}</dd>
    </div>
  );
}
