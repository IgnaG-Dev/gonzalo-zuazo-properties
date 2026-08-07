import { NextResponse, type NextRequest } from "next/server";
import { ingestApifyRun } from "../../../../lib/ingest";

export const runtime = "nodejs";

interface ApifyWebhookPayload {
  resource?: { id?: string };
}

/**
 * Webhook de finalización de corrida de Apify. Apify no soporta firma HMAC
 * en webhooks, solo un secreto en query string — por eso `ingestApifyRun`
 * además valida que `resource.id` corresponda a un `scrape_runs` que
 * nosotros mismos creamos al disparar la corrida.
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret || secret !== process.env.APIFY_INGEST_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ApifyWebhookPayload;
  const runId = payload.resource?.id;

  if (!runId) {
    return NextResponse.json({ error: "missing resource.id" }, { status: 400 });
  }

  try {
    await ingestApifyRun(runId);
  } catch (error) {
    console.error("[api/ingest/apify] error procesando webhook", error);
    // 200 igual: evita que Apify reintente indefinidamente un run que no reconocemos.
  }

  return NextResponse.json({ ok: true });
}
