"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import type { Lead } from "../../../lib/types";
import { FeatureBadges } from "../FeatureBadges";
import { StatusBadge } from "../leads/StatusBadge";
import { Modal } from "../Modal";

export function PropertyDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const cover = lead.photos[0];

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Detalle de la propiedad"
      className="relative flex max-h-[85vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] dark:border-neutral-800/80 dark:bg-neutral-900"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {cover ? (
          <Image
            src={cover}
            alt={lead.address ?? "Propiedad"}
            fill
            sizes="600px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300 dark:text-neutral-700">
            <ImageOff className="size-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 pr-8">
        <div>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "Precio no informado"}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{lead.address ?? "(sin dirección)"}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <Field label="Tamaño" value={lead.size_m2 != null ? `${lead.size_m2} m²` : "—"} />
        <Field label="Habitaciones" value={lead.rooms ?? "—"} />
        <Field label="Baños" value={lead.bathrooms ?? "—"} />
        <Field label="Planta" value={lead.floor ?? "—"} />
        <Field label="Tipo" value={lead.property_type ?? "—"} />
        <Field label="Teléfono" value={lead.phone_e164 ?? "sin normalizar"} />
      </dl>

      <FeatureBadges lead={lead} />

      {lead.description && (
        <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {lead.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-neutral-500 dark:text-neutral-500">
          {lead.owner_name ?? "Propietario desconocido"}
        </span>
        {lead.source_url && (
          <a
            href={lead.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent-700 transition-colors hover:text-accent-800 dark:text-accent-300 dark:hover:text-accent-200"
          >
            Ver en Idealista →
          </a>
        )}
      </div>
    </Modal>
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
