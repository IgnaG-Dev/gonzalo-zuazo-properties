import type { LeadStatus } from "../../../lib/types";

const STYLES: Record<LeadStatus, { pill: string; dot: string }> = {
  "nuevo lead": {
    pill: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    dot: "bg-neutral-400",
  },
  "en duda": {
    pill: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  interesado: {
    pill: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  "no interesado": {
    pill: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
