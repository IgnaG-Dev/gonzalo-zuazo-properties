export default function SettingsLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800/60" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-40 animate-pulse bg-neutral-100 dark:bg-neutral-800/60" />
        ))}
      </div>
    </div>
  );
}
