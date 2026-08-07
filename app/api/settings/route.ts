import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import type { Settings } from "../../../lib/types";

export const runtime = "nodejs";

type SettingsUpdateBody = Partial<Omit<Settings, "id" | "updated_at">>;

/** Actualiza la fila única de configuración (id=1) desde /settings. */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SettingsUpdateBody;

  const { error } = await supabase
    .from("settings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
