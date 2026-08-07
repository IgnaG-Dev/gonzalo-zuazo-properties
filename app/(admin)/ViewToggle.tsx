import Link from "next/link";

export function ViewToggle({
  basePath,
  current,
  options,
  searchParams,
}: {
  basePath: string;
  current: string;
  options: { value: string; label: string }[];
  searchParams: Record<string, string | undefined>;
}) {
  function hrefFor(value: string) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val && key !== "view" && key !== "page") params.set(key, val);
    }
    if (value !== options[0].value) params.set("view", value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="segmented">
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={hrefFor(opt.value)}
          aria-current={current === opt.value ? "true" : undefined}
          className={current === opt.value ? "segmented-option-active" : "segmented-option"}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
