"use client";

import { PhoneOff } from "lucide-react";
import { Modal } from "../Modal";
import type { Owner } from "./types";

export function OwnerDetailModal({ owner, onClose }: { owner: Owner; onClose: () => void }) {
  return (
    <Modal onClose={onClose} ariaLabel="Detalle del propietario">
      <div className="pr-8">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {owner.ownerName ?? "Sin nombre"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
          {owner.phoneE164 ?? owner.phoneRaw ?? "sin teléfono"}
          {owner.inDnc && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <PhoneOff className="size-3" strokeWidth={2} />
              DNC
            </span>
          )}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-500">Tipo de vendedor</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">{owner.sellerType ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-500">Propiedades</dt>
          <dd className="tabular-nums text-neutral-900 dark:text-neutral-100">{owner.propertyCount}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500 dark:text-neutral-500">Última actividad</dt>
          <dd className="text-neutral-900 dark:text-neutral-100">
            {new Date(owner.lastActivity).toLocaleString("es-ES")}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}
