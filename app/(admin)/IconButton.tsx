import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type IconButtonBaseProps = {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "danger";
  disabled?: boolean;
};

type IconButtonProps =
  | (IconButtonBaseProps & { href: string; onClick?: never })
  | (IconButtonBaseProps & { href?: never; onClick: () => void });

const DANGER_CLASSES = "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300";

export function IconButton(props: IconButtonProps) {
  const { icon: Icon, label, variant = "default", disabled } = props;
  const className = `btn-ghost !px-2 ${variant === "danger" ? DANGER_CLASSES : ""}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} aria-label={label} title={label} className={className}>
        <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
