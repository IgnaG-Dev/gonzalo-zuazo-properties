import { createAdminClient } from "./supabase/admin";
import { isWithinCallingWindow } from "./calling-hours";
import type { Lead, Settings } from "./types";

/**
 * Devuelve los leads elegibles para recibir una llamada AHORA, aplicando
 * todas las reglas de cumplimiento:
 *  - status activo ('nuevo lead' | 'en duda') — nunca 'interesado'/'no interesado'.
 *  - call_attempts < max_call_attempts.
 *  - tiene phone_e164.
 *  - no está en do_not_call.
 *  - next_eligible_call_at vencido (o null).
 *  - dentro del horario de llamada configurado (Europe/Madrid por defecto).
 */
export async function getEligibleLeads(settings: Settings): Promise<Lead[]> {
  if (!isWithinCallingWindow(settings, new Date())) {
    return [];
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const [{ data: leads, error: leadsError }, { data: dncEntries, error: dncError }] = await Promise.all([
    admin
      .from("leads")
      .select("*")
      .in("status", ["nuevo lead", "en duda"])
      .lt("call_attempts", settings.max_call_attempts)
      .not("phone_e164", "is", null)
      .or(`next_eligible_call_at.is.null,next_eligible_call_at.lte.${nowIso}`)
      .order("created_at", { ascending: true }),
    admin.from("do_not_call").select("phone_e164"),
  ]);

  if (leadsError) throw leadsError;
  if (dncError) throw dncError;

  const dncSet = new Set((dncEntries ?? []).map((entry) => entry.phone_e164));

  return (leads ?? []).filter((lead) => lead.phone_e164 && !dncSet.has(lead.phone_e164));
}
