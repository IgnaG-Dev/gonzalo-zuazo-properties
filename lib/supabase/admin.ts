import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types";

/**
 * Cliente Supabase con service role key: bypasea RLS. Solo para código de
 * servidor de confianza (webhooks, worker, rutas API internas) — nunca
 * exponer al cliente/navegador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
