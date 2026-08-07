"use client";

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { IconButton } from "./IconButton";

export function ConfirmActionButton({
  icon,
  label,
  confirmMessage,
  variant = "default",
  disabled,
  onConfirm,
}: {
  icon: LucideIcon;
  label: string;
  confirmMessage: string;
  variant?: "default" | "danger";
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;

    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <IconButton
      icon={icon}
      label={label}
      variant={variant}
      disabled={disabled || pending}
      onClick={handleClick}
    />
  );
}
