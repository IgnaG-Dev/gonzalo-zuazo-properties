export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const TONE_STYLES: Record<BadgeTone, { pill: string; dot: string }> = {
  neutral: {
    pill: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    dot: "bg-neutral-400",
  },
  info: {
    pill: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
    dot: "bg-accent-500",
  },
  success: {
    pill: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  warning: {
    pill: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  danger: {
    pill: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
  },
};

export function Badge({
  tone,
  dot = false,
  pulse = false,
  children,
}: {
  tone: BadgeTone;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const style = TONE_STYLES[tone];

  return (
    <span className={`badge ${style.pill}`}>
      {dot && (
        <span
          className={`size-1.5 rounded-full ${style.dot} ${pulse ? "animate-pulse" : ""}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
