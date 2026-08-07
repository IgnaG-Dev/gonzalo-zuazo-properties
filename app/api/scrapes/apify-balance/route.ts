import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { fetchAccountLimits } from "../../../../lib/apify";

export const runtime = "nodejs";

/** Crédito mensual restante en Apify — usado para deshabilitar "Ejecutar ahora" sin saldo. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const limits = await fetchAccountLimits();
    return NextResponse.json(limits);
  } catch (error) {
    console.error("[api/scrapes/apify-balance] error", error);
    const message = error instanceof Error ? error.message : "error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
