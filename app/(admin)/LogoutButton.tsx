"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function LogoutButton({ className = "sidebar-link w-full" }: { className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className}>
      <LogOut className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      Cerrar sesión
    </button>
  );
}
