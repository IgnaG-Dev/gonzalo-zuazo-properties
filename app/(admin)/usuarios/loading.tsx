export default function UsuariosLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-6 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
        </div>
        <div className="h-9 w-64 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800/60" />
      </div>
      <div className="table-shell">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3.5">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-28 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="h-4 w-16 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="ml-auto h-4 w-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
