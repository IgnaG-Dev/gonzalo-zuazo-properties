import { createAdminClient } from "../../lib/supabase/admin";
import { startScrapeRun } from "../../lib/ingest";

/**
 * Job programado de scraping. A diferencia del botón "Ejecutar ahora" del
 * panel (que llama a startScrapeRun directamente), este respeta el toggle
 * `settings.is_scraping_enabled` para poder pausar la automatización sin
 * tocar el cron.
 */
export async function runScrapeJob(): Promise<void> {
  const admin = createAdminClient();
  const { data: settings, error } = await admin
    .from("settings")
    .select("is_scraping_enabled")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("[worker/scrape] no se pudo leer settings", error);
    return;
  }

  if (!settings.is_scraping_enabled) {
    console.log("[worker/scrape] scraping deshabilitado, se omite");
    return;
  }

  try {
    const { apifyRunId } = await startScrapeRun();
    console.log(`[worker/scrape] corrida disparada: ${apifyRunId}`);
  } catch (error) {
    console.error("[worker/scrape] error disparando corrida", error);
  }
}
