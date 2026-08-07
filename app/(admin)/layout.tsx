import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar email={user.email ?? ""} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileNav email={user.email ?? ""} />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
