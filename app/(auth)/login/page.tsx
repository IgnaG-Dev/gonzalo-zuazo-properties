import Image from "next/image";
import { Lock } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent-900 via-accent-800 to-accent-700 px-8 py-14 lg:w-1/2 lg:py-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_35%,rgba(255,255,255,0.08)_0%,transparent_70%)]"
        />
        <div className="relative flex w-full max-w-xs flex-col items-center gap-3 lg:max-w-sm">
          <Image
            src="/brand/logo.png"
            alt="Gonzalo Zuazo Properties"
            width={914}
            height={457}
            priority
            className="h-auto w-full"
          />
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_45%_at_50%_0%,var(--color-accent-100)_0%,transparent_70%)] dark:[background:radial-gradient(60%_45%_at_50%_0%,rgba(15,92,116,0.25)_0%,transparent_70%)]"
        />

        <div className="animate-fade-up relative w-full max-w-sm">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Accede al panel de administración
            </p>
          </div>

          <div className="relative rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-15px_rgba(0,0,0,0.15)] sm:p-8 dark:border-neutral-800/80 dark:bg-neutral-900 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_25px_50px_-12px_rgba(0,0,0,0.6)]">
            <div className="mb-6 flex justify-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-500/10 dark:text-accent-300 dark:ring-accent-500/20">
                <Lock aria-hidden="true" className="size-5" strokeWidth={2} />
              </div>
            </div>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600 lg:text-left">
            Acceso restringido al equipo autorizado.
          </p>
        </div>
      </div>
    </main>
  );
}
