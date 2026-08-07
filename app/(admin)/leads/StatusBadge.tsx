import { Badge, type BadgeTone } from "../Badge";
import type { LeadStatus } from "../../../lib/types";

const TONES: Record<LeadStatus, BadgeTone> = {
  "nuevo lead": "neutral",
  "en duda": "warning",
  interesado: "success",
  "no interesado": "danger",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge tone={TONES[status]} dot>
      {status}
    </Badge>
  );
}
