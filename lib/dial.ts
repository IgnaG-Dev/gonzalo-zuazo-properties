import { createAdminClient } from "./supabase/admin";
import { getEligibleLeads } from "./eligibility";
import { createPhoneCall } from "./retell";
import type { Lead } from "./types";

const DIAL_CONCURRENCY = 3;

export interface DialBatchResult {
  attempted: number;
  succeeded: number;
  failed: number;
}

/**
 * Procesa el batch de leads elegibles: dispara una llamada Retell por lead
 * con un límite de concurrencia (para no saturar límites de Retell/Twilio),
 * registra el intento en `call_logs` y avanza `leads.call_attempts` /
 * `next_eligible_call_at` — incluso si la llamada falla al disparar, cuenta
 * como intento para no reintentar en bucle contra un número inválido.
 */
export async function runDialBatch(): Promise<DialBatchResult> {
  const admin = createAdminClient();

  const { data: settings, error: settingsError } = await admin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (settingsError) throw settingsError;
  if (!settings.is_dialing_enabled) {
    return { attempted: 0, succeeded: 0, failed: 0 };
  }

  const eligibleLeads = await getEligibleLeads(settings);

  let succeeded = 0;
  let failed = 0;

  await runWithConcurrencyLimit(eligibleLeads, DIAL_CONCURRENCY, async (lead) => {
    const ok = await callLead(lead, settings.min_hours_between_attempts);
    if (ok) succeeded += 1;
    else failed += 1;
  });

  return { attempted: eligibleLeads.length, succeeded, failed };
}

async function callLead(lead: Lead, minHoursBetweenAttempts: number): Promise<boolean> {
  const admin = createAdminClient();
  const attemptNumber = lead.call_attempts + 1;
  const now = new Date();
  const nextEligible = new Date(now.getTime() + minHoursBetweenAttempts * 60 * 60 * 1000);

  try {
    const call = await createPhoneCall({
      toNumber: lead.phone_e164!,
      dynamicVariables: {
        owner_name: lead.owner_name ?? "propietario",
        address: lead.address ?? "",
        price: lead.price != null ? String(lead.price) : "",
        listing_url: lead.source_url ?? "",
      },
      metadata: { lead_id: lead.id },
    });

    await admin.from("call_logs").insert({
      lead_id: lead.id,
      retell_call_id: call.call_id,
      attempt_number: attemptNumber,
      started_at: now.toISOString(),
    });

    await admin
      .from("leads")
      .update({
        call_attempts: attemptNumber,
        last_call_at: now.toISOString(),
        next_eligible_call_at: nextEligible.toISOString(),
      })
      .eq("id", lead.id);

    return true;
  } catch (error) {
    await admin.from("call_logs").insert({
      lead_id: lead.id,
      attempt_number: attemptNumber,
      started_at: now.toISOString(),
      ended_at: now.toISOString(),
      call_successful: false,
      raw_webhook_payload: { triggerError: error instanceof Error ? error.message : String(error) },
    });

    await admin
      .from("leads")
      .update({
        call_attempts: attemptNumber,
        last_call_at: now.toISOString(),
        next_eligible_call_at: nextEligible.toISOString(),
      })
      .eq("id", lead.id);

    return false;
  }
}

async function runWithConcurrencyLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;

  async function runNext(): Promise<void> {
    const index = cursor;
    cursor += 1;
    if (index >= items.length) return;
    await worker(items[index]);
    await runNext();
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(runners);
}
