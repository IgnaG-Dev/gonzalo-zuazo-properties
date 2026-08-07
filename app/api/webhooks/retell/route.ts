import { NextResponse, type NextRequest } from "next/server";
import { verifyRetellSignature } from "../../../../lib/retell";
import { createAdminClient } from "../../../../lib/supabase/admin";
import type { Lead, LeadStatus } from "../../../../lib/types";

export const runtime = "nodejs";

interface RetellCallAnalysis {
  call_successful?: boolean;
  user_sentiment?: string;
  custom_analysis_data?: {
    interest_level?: string;
    meeting_requested?: boolean;
    meeting_notes?: string;
    do_not_call_requested?: boolean;
  };
}

interface RetellCallPayload {
  call_id: string;
  start_timestamp?: number;
  end_timestamp?: number;
  transcript?: string;
  transcript_object?: unknown;
  recording_url?: string;
  metadata?: { lead_id?: string };
  call_analysis?: RetellCallAnalysis;
}

interface RetellWebhookBody {
  event: "call_started" | "call_ended" | "call_analyzed";
  call: RetellCallPayload;
}

const INTEREST_LEVEL_TO_STATUS: Record<string, LeadStatus> = {
  interested: "interesado",
  interesado: "interesado",
  not_interested: "no interesado",
  no_interesado: "no interesado",
  unsure: "en duda",
  undecided: "en duda",
  maybe: "en duda",
  en_duda: "en duda",
};

/**
 * Webhook de eventos de llamada de Retell. Verifica `X-Retell-Signature`
 * (HMAC sobre el body crudo) y es upsert-safe por `retell_call_id`, ya que
 * Retell puede reintentar la entrega del mismo evento.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-retell-signature");

  if (!verifyRetellSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as RetellWebhookBody;
  const { event, call } = body;
  const leadId = call.metadata?.lead_id ?? null;

  if (!leadId) {
    // Llamada de prueba disparada fuera de nuestro pipeline (ej. desde el
    // dashboard de Retell) — no hay lead al que asociarla, se ignora.
    console.warn("[api/webhooks/retell] call sin metadata.lead_id, se ignora", call.call_id);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();

  const startedAt = call.start_timestamp ? new Date(call.start_timestamp).toISOString() : null;
  const endedAt = call.end_timestamp ? new Date(call.end_timestamp).toISOString() : null;
  const analysis = call.call_analysis;
  const interestLevelRaw = analysis?.custom_analysis_data?.interest_level?.toLowerCase();
  const resultingStatus = interestLevelRaw ? INTEREST_LEVEL_TO_STATUS[interestLevelRaw] ?? null : null;

  const { data: existingLog } = await admin
    .from("call_logs")
    .select("id, attempt_number")
    .eq("retell_call_id", call.call_id)
    .maybeSingle();

  const callLogFields = {
    lead_id: leadId,
    retell_call_id: call.call_id,
    transcript: call.transcript ?? null,
    transcript_json: call.transcript_object ?? null,
    recording_url: call.recording_url ?? null,
    call_successful: analysis?.call_successful ?? null,
    user_sentiment: analysis?.user_sentiment ?? null,
    custom_analysis: analysis?.custom_analysis_data ?? null,
    resulting_status: resultingStatus,
    raw_webhook_payload: body as unknown as Record<string, unknown>,
    started_at: startedAt,
    ended_at: endedAt,
  };

  if (existingLog) {
    await admin.from("call_logs").update(callLogFields).eq("id", existingLog.id);
  } else {
    // Llamada disparada fuera de runDialBatch (ej. prueba manual desde el
    // panel) — calculamos el número de intento a partir del historial.
    const { count } = await admin
      .from("call_logs")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", leadId);

    await admin.from("call_logs").insert({ ...callLogFields, attempt_number: (count ?? 0) + 1 });
  }

  if (event === "call_analyzed") {
    const leadUpdate: Partial<Lead> = {};

    if (resultingStatus) {
      leadUpdate.status = resultingStatus;
    }

    if (analysis?.custom_analysis_data?.meeting_requested !== undefined) {
      leadUpdate.meeting_requested = analysis.custom_analysis_data.meeting_requested;
    }

    if (analysis?.custom_analysis_data?.meeting_notes) {
      leadUpdate.meeting_notes = analysis.custom_analysis_data.meeting_notes;
    }

    if (Object.keys(leadUpdate).length > 0) {
      await admin.from("leads").update(leadUpdate).eq("id", leadId);
    }

    if (analysis?.custom_analysis_data?.do_not_call_requested) {
      const { data: lead } = await admin
        .from("leads")
        .select("phone_e164")
        .eq("id", leadId)
        .maybeSingle();

      if (lead?.phone_e164) {
        await admin
          .from("do_not_call")
          .upsert(
            { phone_e164: lead.phone_e164, reason: "Solicitado por el propietario durante la llamada" },
            { onConflict: "phone_e164" }
          );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
