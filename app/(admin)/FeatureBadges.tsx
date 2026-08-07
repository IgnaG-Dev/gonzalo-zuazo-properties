import { ArrowUpDown, Box, Snowflake, Sun, Trees, Waves } from "lucide-react";
import type { Lead } from "../../lib/types";

const FEATURE_ICONS: { key: keyof NonNullable<Lead["features"]>; label: string; Icon: typeof Waves }[] = [
  { key: "hasSwimmingPool", label: "Piscina", Icon: Waves },
  { key: "hasTerrace", label: "Terraza", Icon: Sun },
  { key: "hasAirConditioning", label: "Aire acondicionado", Icon: Snowflake },
  { key: "hasGarden", label: "Jardín", Icon: Trees },
  { key: "hasBoxRoom", label: "Trastero", Icon: Box },
];

export function FeatureBadges({
  lead,
  compact = false,
}: {
  lead: Pick<Lead, "features" | "has_lift">;
  compact?: boolean;
}) {
  const badges: { label: string; Icon: typeof Waves }[] = [];

  for (const { key, label, Icon } of FEATURE_ICONS) {
    if (lead.features?.[key]) badges.push({ label, Icon });
  }
  if (lead.has_lift) badges.push({ label: "Ascensor", Icon: ArrowUpDown });

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "gap-2"}`}>
      {badges.map(({ label, Icon }) => (
        <span
          key={label}
          title={compact ? label : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full bg-neutral-100 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 ${
            compact ? "px-1.5 py-1" : "px-2.5 py-1 text-xs"
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {!compact && label}
        </span>
      ))}
    </div>
  );
}
