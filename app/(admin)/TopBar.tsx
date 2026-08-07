"use client";

import { ChevronDown, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { getActiveNavItem } from "./nav-items";

export function TopBar({ email }: { email: string }) {
  const pathname = usePathname();
  const activeItem = getActiveNavItem(pathname);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 md:flex dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {activeItem?.label ?? "Panel"}
      </h2>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            <User className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="max-w-[200px] truncate">{email}</span>
          <ChevronDown className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="truncate px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-500">{email}</p>
            <LogoutButton className="sidebar-link w-full" />
          </div>
        )}
      </div>
    </header>
  );
}
