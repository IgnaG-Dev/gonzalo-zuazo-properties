import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import type { LeadStatus } from "../../../../../lib/types";

export const runtime = "nodejs";

const VALID_STATUSES: LeadStatus[] = ["nuevo lead", "en duda", "interesado", "no interesado"];

interface StatusUpdateBody {
  status?: string;
  meeting_requested?: boolean;
  meeting_notes?: string | null;
}

/** Override manual del estado de un lead desde /leads/[id]. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as StatusUpdateBody;

  const update: Partial<{
    status: LeadStatus;
    meeting_requested: boolean;
    meeting_notes: string | null;
  }> = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as LeadStatus)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }
    update.status = body.status as LeadStatus;
  }

  if (body.meeting_requested !== undefined) {
    update.meeting_requested = body.meeting_requested;
  }

  if (body.meeting_notes !== undefined) {
    update.meeting_notes = body.meeting_notes;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada que actualizar" }, { status: 400 });
  }

  const { error } = await supabase.from("leads").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
