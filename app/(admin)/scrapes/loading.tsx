export default function ScrapesLoading() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
        </div>
        <div className="h-9 w-32 shrink-0 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800/60" />
      </div>

      <div className="mb-4 h-9 w-full max-w-md animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800/60" />

      <div className="table-shell">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3.5">
              <div className="h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
              <div className="ml-auto h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
