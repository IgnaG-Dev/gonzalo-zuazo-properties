"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { useSidebarCollapsed } from "./useSidebarCollapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarCollapsed();

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-neutral-200 bg-white transition-[width] duration-150 ease-out md:flex dark:border-neutral-800 dark:bg-neutral-900 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <div className="flex items-center justify-center border-b border-neutral-200 px-3 py-6 dark:border-neutral-800">
        <div className="flex h-20 w-full items-center justify-center rounded-lg bg-accent-900 p-2.5">
          <Image
            src="/brand/logo.png"
            alt="Gonzalo Zuazo Properties"
            width={914}
            height={457}
            priority
            className="h-full w-full object-contain"
          />
        </div>
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
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={`${isActive ? "sidebar-link-active" : "sidebar-link"} ${collapsed ? "justify-center !px-0" : ""}`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className={`sidebar-link w-full ${collapsed ? "justify-center !px-0" : ""}`}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              Contraer
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
