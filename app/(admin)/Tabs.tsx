import Link from "next/link";

export function Tabs({
  basePath,
  paramName,
  current,
  options,
  searchParams,
}: {
  basePath: string;
  paramName: string;
  current: string;
  options: { value: string; label: string }[];
  searchParams: Record<string, string | undefined>;
}) {
  function hrefFor(value: string) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val && key !== paramName && key !== "page") params.set(key, val);
    }
    if (value !== options[0].value) params.set(paramName, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="mb-5 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
      {options.map((opt) => {
        const isActive = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={hrefFor(opt.value)}
            aria-current={isActive ? "page" : undefined}
            className={`relative px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "text-accent-700 dark:text-accent-300"
                : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {opt.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-600 dark:bg-accent-400" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
