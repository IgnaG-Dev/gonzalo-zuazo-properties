import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { startScrapeRun } from "../../../../lib/ingest";

export const runtime = "nodejs";

/** Dispara manualmente una corrida de scrape (botón "Ejecutar ahora" en /scrapes). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await startScrapeRun();
    return NextResponse.json({ ok: true, apifyRunId: result.apifyRunId });
  } catch (error) {
    console.error("[api/scrapes/trigger] error", error);
    const message = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
