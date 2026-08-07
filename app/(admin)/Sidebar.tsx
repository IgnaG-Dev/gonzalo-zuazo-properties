"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { LogoutButton } from "./LogoutButton";

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-center border-b border-neutral-200 px-5 py-6 dark:border-neutral-800">
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
  );
}
