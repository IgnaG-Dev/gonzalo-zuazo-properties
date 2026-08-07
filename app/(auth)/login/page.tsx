import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-accent-600 text-sm font-semibold text-white">
            GZ
          </div>
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Gonzalo Zuazo Properties
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Panel de administración
          </p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
