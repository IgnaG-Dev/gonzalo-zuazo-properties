"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TriggerScrapeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/scrapes/trigger", { method: "POST" });

    setLoading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "error al disparar la corrida");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button onClick={handleClick} disabled={loading} className="btn-primary">
        {loading ? "Ejecutando…" : "Ejecutar ahora"}
      </button>
      {error && <p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
