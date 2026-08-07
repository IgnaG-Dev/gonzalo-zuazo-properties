import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { normalizeToE164Spain } from "../../../lib/phone";

export const runtime = "nodejs";

interface DncAddBody {
  phone: string;
  reason?: string;
}

/** Alta en la lista de exclusión (do_not_call). */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as DncAddBody;
  const phoneE164 = normalizeToE164Spain(body.phone);

  if (!phoneE164) {
    return NextResponse.json({ error: "teléfono inválido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("do_not_call")
    .upsert({ phone_e164: phoneE164, reason: body.reason ?? null }, { onConflict: "phone_e164" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, phone_e164: phoneE164 });
}

/** Baja de la lista de exclusión por id. */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "falta id" }, { status: 400 });
  }

  const { error } = await supabase.from("do_not_call").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
