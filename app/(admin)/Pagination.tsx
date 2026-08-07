import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({
  basePath,
  currentPage,
  totalPages,
  searchParams,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Paginación">
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(Math.max(1, currentPage - 1))}
          aria-disabled={isFirst}
          tabIndex={isFirst ? -1 : undefined}
          className={`pagination-btn ${isFirst ? "pointer-events-none opacity-40" : ""}`}
        >
          <ChevronLeft className="size-4" />
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, currentPage + 1))}
          aria-disabled={isLast}
          tabIndex={isLast ? -1 : undefined}
          className={`pagination-btn ${isLast ? "pointer-events-none opacity-40" : ""}`}
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
