import "dotenv/config";
import cron from "node-cron";
import { createAdminClient } from "../lib/supabase/admin";
import { runScrapeJob } from "./jobs/scrape";
import { runDialJob } from "./jobs/dial";

const RECONCILE_INTERVAL_MS = 60_000;

type CronTask = ReturnType<typeof cron.schedule>;

interface ScheduledJob {
  cronExpression: string;
  timezone: string;
  task: CronTask;
}

let scrapeJob: ScheduledJob | null = null;
let dialJob: ScheduledJob | null = null;

/**
 * (Re)programa un job si el cron expression o la timezone cambiaron desde
 * /settings. Se llama periódicamente en vez de una sola vez al boot para que
 * los cambios hechos desde el panel se apliquen sin reiniciar el worker.
 */
function reconcileJob(
  current: ScheduledJob | null,
  name: string,
  cronExpression: string,
  timezone: string,
  handler: () => Promise<void>
): ScheduledJob | null {
  if (current && current.cronExpression === cronExpression && current.timezone === timezone) {
    return current;
  }

  if (!cron.validate(cronExpression)) {
    console.error(`[worker] cron inválido para ${name}: "${cronExpression}" — se mantiene la programación anterior`);
    return current;
  }

  if (current) {
    current.task.destroy();
  }

  console.log(`[worker] (re)programando ${name}: "${cronExpression}" (${timezone})`);
  const task = cron.schedule(cronExpression, () => void handler(), { timezone });

  return { cronExpression, timezone, task };
}

async function reconcile(): Promise<void> {
  const admin = createAdminClient();
  const { data: settings, error } = await admin
    .from("settings")
    .select("scrape_schedule_cron, dial_schedule_cron, timezone")
    .eq("id", 1)
    .single();

  if (error || !settings) {
    console.error("[worker] no se pudo leer settings para programar los jobs", error);
    return;
  }

  scrapeJob = reconcileJob(scrapeJob, "scrape", settings.scrape_schedule_cron, settings.timezone, runScrapeJob);
  dialJob = reconcileJob(dialJob, "dial", settings.dial_schedule_cron, settings.timezone, runDialJob);
}

async function main(): Promise<void> {
  console.log("[worker] iniciando scheduler…");
  await reconcile();
  setInterval(() => void reconcile(), RECONCILE_INTERVAL_MS);
}

function shutdown(): void {
  console.log("[worker] apagando…");
  scrapeJob?.task.destroy();
  dialJob?.task.destroy();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main().catch((error) => {
  console.error("[worker] error fatal al iniciar", error);
  process.exit(1);
});
