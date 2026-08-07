import { createAdminClient } from "./supabase/admin";
import { fetchDatasetItems, fetchRun, mapApifyItemToLead, triggerScrapeRun } from "./apify";
import { normalizeToE164Spain } from "./phone";
import type { ScrapeRunStatus } from "./types";

/**
 * Dispara una nueva corrida del actor de Apify y registra la fila de
 * `scrape_runs` correspondiente ANTES de que llegue cualquier webhook, para
 * que /api/ingest/apify pueda validar `resource.id` contra un run conocido
 * (Apify no firma sus webhooks, solo soporta un secreto en query string).
 */
export async function startScrapeRun(): Promise<{ apifyRunId: string }> {
  const admin = createAdminClient();

  const { data: settings, error: settingsError } = await admin
    .from("settings")
    .select("scrape_location_id, scrape_location_name, scrape_num_pages, scrape_since_date")
    .eq("id", 1)
    .single();

  if (settingsError) throw settingsError;
  if (!settings?.scrape_location_id || !settings?.scrape_location_name) {
    throw new Error("settings.scrape_location_id / scrape_location_name no están configurados");
  }

  const run = await triggerScrapeRun({
    locationId: settings.scrape_location_id,
    locationName: settings.scrape_location_name,
    numPages: settings.scrape_num_pages,
    sinceDate: settings.scrape_since_date,
  });

  const { error: insertError } = await admin.from("scrape_runs").insert({
    apify_run_id: run.id,
    status: "running",
    started_at: new Date().toISOString(),
  });

  if (insertError) throw insertError;

  return { apifyRunId: run.id };
}

const APIFY_STATUS_MAP: Record<string, ScrapeRunStatus> = {
  READY: "pending",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  ABORTED: "aborted",
  ABORTING: "aborted",
  "TIMED-OUT": "failed",
  TIMED_OUT: "failed",
};

/**
 * Procesa el webhook de finalización de Apify. Solo actúa si `apifyRunId`
 * corresponde a un `scrape_runs` que nosotros mismos creamos en
 * `startScrapeRun` — esa es la única verificación de autenticidad posible,
 * ya que Apify no soporta HMAC en webhooks.
 */
export async function ingestApifyRun(apifyRunId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: scrapeRun, error: scrapeRunError } = await admin
    .from("scrape_runs")
    .select("id, apify_run_id, status")
    .eq("apify_run_id", apifyRunId)
    .maybeSingle();

  if (scrapeRunError) throw scrapeRunError;
  if (!scrapeRun) {
    throw new Error(`scrape_runs desconocido para apify_run_id=${apifyRunId}, se ignora`);
  }

  const run = await fetchRun(apifyRunId);
  const mappedStatus = APIFY_STATUS_MAP[run.status] ?? "failed";

  if (mappedStatus !== "succeeded") {
    await admin
      .from("scrape_runs")
      .update({
        status: mappedStatus,
        error_message: mappedStatus === "failed" ? `Run terminó con estado ${run.status}` : null,
        finished_at: new Date().toISOString(),
      })
      .eq("apify_run_id", apifyRunId);
    return;
  }

  let leadsCreated = 0;
  let leadsUpdated = 0;
  let leadsSkippedAgency = 0;
  let leadsSkippedInvalid = 0;
  let errorMessage: string | null = null;

  try {
    const items = await fetchDatasetItems(run.defaultDatasetId);

    const mapped = items.map(mapApifyItemToLead);

    const validRows = mapped.filter((item) => {
      if (!item.idealista_property_code) {
        leadsSkippedInvalid += 1;
        return false;
      }
      if (item.isAgency) {
        leadsSkippedAgency += 1;
        return false;
      }
      return true;
    });

    if (validRows.length > 0) {
      const codes = validRows.map((row) => row.idealista_property_code);

      const { data: existing, error: existingError } = await admin
        .from("leads")
        .select("idealista_property_code")
        .in("idealista_property_code", codes);

      if (existingError) throw existingError;

      const existingCodes = new Set((existing ?? []).map((row) => row.idealista_property_code));

      const upsertRows = validRows.map((row) => ({
        idealista_property_code: row.idealista_property_code,
        source_url: row.source_url,
        address: row.address,
        price: row.price,
        size_m2: row.size_m2,
        rooms: row.rooms,
        owner_name: row.owner_name,
        phone_raw: row.phone_raw,
        phone_e164: normalizeToE164Spain(row.phone_raw),
        seller_type: row.seller_type,
        raw_scrape_data: row.raw_scrape_data,
        photos: row.photos,
        description: row.description,
        bathrooms: row.bathrooms,
        floor: row.floor,
        property_type: row.property_type,
        has_lift: row.has_lift,
        exterior: row.exterior,
        features: row.features,
      }));

      const { error: upsertError } = await admin
        .from("leads")
        .upsert(upsertRows, { onConflict: "idealista_property_code" });

      if (upsertError) throw upsertError;

      for (const code of codes) {
        if (existingCodes.has(code)) leadsUpdated += 1;
        else leadsCreated += 1;
      }
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  await admin
    .from("scrape_runs")
    .update({
      status: errorMessage ? "failed" : "succeeded",
      leads_created: leadsCreated,
      leads_updated: leadsUpdated,
      leads_skipped_agency: leadsSkippedAgency,
      leads_skipped_invalid: leadsSkippedInvalid,
      error_message: errorMessage,
      finished_at: new Date().toISOString(),
    })
    .eq("apify_run_id", apifyRunId);
}
