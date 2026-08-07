import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { fetchDatasetInfo, fetchRun, fetchRunLogTail } from "../../../../../lib/apify";

export const runtime = "nodejs";

/**
 * Progreso en vivo de una corrida de Apify (usado por /scrapes mientras el
 * estado es "running"): cantidad real de anuncios ya extraídos y últimas
 * líneas del log del actor. Todo viene directo de la API de Apify, no se
 * calcula ni se simula nada acá.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: apifyRunId } = await params;

  try {
    const run = await fetchRun(apifyRunId);
    const [dataset, logTail] = await Promise.all([
      fetchDatasetInfo(run.defaultDatasetId),
      fetchRunLogTail(apifyRunId),
    ]);

    return NextResponse.json({
      status: run.status,
      itemCount: dataset.itemCount,
      logTail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
