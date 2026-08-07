import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // El middleware ya valida la sesión contra Supabase Auth y propaga el
  // email vía header; evita repetir ese round-trip de red acá.
  const headerList = await headers();
  const email = headerList.get("x-user-email");

  if (!email) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar email={email} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav email={email} />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
