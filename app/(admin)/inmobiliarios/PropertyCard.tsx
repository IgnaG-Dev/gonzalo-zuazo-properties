import { ImageOff } from "lucide-react";
import Image from "next/image";
import type { Lead } from "../../../lib/types";
import { FeatureBadges } from "../FeatureBadges";
import { StatusBadge } from "../leads/StatusBadge";

export function PropertyCard({ lead }: { lead: Lead }) {
  const cover = lead.photos[0];

  return (
    <div className="property-card">
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
        {cover ? (
          <Image
            src={cover}
            alt={lead.address ?? "Propiedad"}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300 dark:text-neutral-700">
            <ImageOff className="size-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={lead.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {lead.price != null ? `${lead.price.toLocaleString("es-ES")} €` : "Precio no informado"}
          </p>
          <p className="line-clamp-1 text-sm text-neutral-600 dark:text-neutral-400">
            {lead.address ?? "(sin dirección)"}
          </p>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          {[
            lead.size_m2 != null ? `${lead.size_m2} m²` : null,
            lead.rooms != null ? `${lead.rooms} hab.` : null,
            lead.bathrooms != null ? `${lead.bathrooms} baños` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Sin detalles"}
        </p>
        <FeatureBadges lead={lead} compact />
        <p className="mt-auto truncate text-xs text-neutral-400 dark:text-neutral-600">
          {lead.owner_name ?? "Propietario desconocido"}
        </p>
      </div>
    </div>
  );
}
