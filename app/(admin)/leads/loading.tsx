export default function LeadsLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="h-6 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
        </div>
        <div className="h-9 w-64 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800/60" />
      </div>

      <div className="flex gap-4 overflow-x-hidden pb-2">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="kanban-column">
            <div className="px-3 py-3">
              <div className="h-3 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="flex flex-col gap-2 px-3 pb-3">
              {Array.from({ length: 3 }).map((_, card) => (
                <div key={card} className="card h-20 animate-pulse bg-neutral-100 p-3 dark:bg-neutral-800/60" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
