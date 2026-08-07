"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  onClose,
  ariaLabel,
  className,
  children,
}: {
  onClose: () => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-neutral-950/50 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={
          className ??
          "relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)] dark:border-neutral-800/80 dark:bg-neutral-900"
        }
      >
        <button onClick={onClose} aria-label="Cerrar" className="btn-ghost absolute right-4 top-4 z-10 !px-2">
          <X className="size-4" strokeWidth={2} />
        </button>
        {children}
      </div>
    </div>
  );
}
