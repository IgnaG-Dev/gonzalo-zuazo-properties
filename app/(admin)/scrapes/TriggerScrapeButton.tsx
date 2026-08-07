"use client";

import { useEffect, useState } from "react";

interface ApifyBalance {
  usageUsd: number;
  maxUsageUsd: number;
  remainingUsd: number;
}

export function TriggerScrapeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<ApifyBalance | null>(null);

  // Se consulta una vez al montar: si no queda crédito mensual en Apify, el
  // botón se deshabilita antes de que el usuario intente disparar la corrida.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/scrapes/apify-balance")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ApifyBalance | null) => {
        if (!cancelled && data) setBalance(data);
      })
      .catch(() => {
        // best-effort: si falla la consulta de saldo, no se bloquea el botón
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const noCredit = balance !== null && balance.remainingUsd <= 0;

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

    // La fila nueva aparece sola vía Realtime (ver ScrapeRunsTable) — no
    // hace falta forzar un refresh de la página.
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleClick}
        disabled={loading || noCredit}
        title={noCredit ? "Sin crédito disponible en Apify este mes" : undefined}
        className="btn-primary"
      >
        {loading ? "Ejecutando…" : "Ejecutar ahora"}
      </button>
      {noCredit && (
        <p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">
          Sin crédito disponible en Apify este mes (usado ${balance.usageUsd.toFixed(2)} de $
          {balance.maxUsageUsd.toFixed(2)}).
        </p>
      )}
      {error && <p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
