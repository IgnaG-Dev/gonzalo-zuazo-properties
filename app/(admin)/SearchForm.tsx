import { Search } from "lucide-react";

export function SearchForm({
  basePath,
  q,
  placeholder,
  hidden,
}: {
  basePath: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form action={basePath} method="GET" className="relative w-full max-w-sm">
      {hidden &&
        Object.entries(hidden).map(([key, value]) =>
          value ? <input key={key} type="hidden" name={key} value={value} /> : null
        )}
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="field-input pl-9"
      />
    </form>
  );
}
