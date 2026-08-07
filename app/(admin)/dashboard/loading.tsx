export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-6 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-[76px] animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card h-56 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
        <div className="card h-56 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
      </div>

      <div className="card h-64 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
    </div>
  );
}
