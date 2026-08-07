"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el drawer automáticamente al navegar a otra sección — ajustado
  // durante el render (no en un efecto) siguiendo el patrón de React para
  // resetear estado cuando cambia un valor derivado de props.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-xs font-semibold text-white">
            GZ
          </div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Gonzalo Zuazo Properties
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="btn-ghost !px-2"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-neutral-950/40 transition-opacity duration-200 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-200 ease-out md:hidden dark:bg-neutral-900 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Menú</p>
          <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="btn-ghost !px-2">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <p className="truncate px-3 py-1 text-xs text-neutral-500 dark:text-neutral-500">{email}</p>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
