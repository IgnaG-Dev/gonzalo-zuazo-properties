export default function InmobiliariosLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-6 w-36 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
        </div>
      </div>
      <div className="mb-5 h-20 animate-pulse rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex flex-col gap-2 p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
