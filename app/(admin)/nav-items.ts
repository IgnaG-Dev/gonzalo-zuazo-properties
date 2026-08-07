import { Building2, KanbanSquare, PhoneOff, RefreshCw, Settings, Users, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/leads", label: "Leads", icon: KanbanSquare },
  { href: "/inmobiliarios", label: "Inmobiliarios", icon: Building2 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/scrapes", label: "Scrapes", icon: RefreshCw },
  { href: "/dnc", label: "Lista de exclusión", icon: PhoneOff },
  { href: "/settings", label: "Configuración", icon: Settings },
];

/** Encuentra el item de nav activo para un pathname — usado por Sidebar, MobileNav y TopBar. */
export function getActiveNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
