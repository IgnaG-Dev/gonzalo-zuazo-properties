import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto assets estáticos (cualquier archivo
     * con extensión, ej. /brand/logo.png, /icon.png), y las rutas
     * /api/webhooks y /api/ingest, que se autentican por firma/secreto
     * propios, no por sesión de Supabase.
     */
    "/((?!_next/static|_next/image|api/webhooks|api/ingest|.*\\..*).*)",
  ],
};
