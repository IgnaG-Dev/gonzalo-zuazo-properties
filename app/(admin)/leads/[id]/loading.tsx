export default function LeadDetailLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />

      <div className="card h-40 animate-pulse bg-neutral-100 p-6 dark:bg-neutral-800/60" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
          ))}
        </div>
        <div className="card h-48 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
      </div>
    </div>
  );
}
