import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Refresca la sesión Supabase en cada request y redirige a /login si no hay
 * sesión activa para rutas del panel admin. También propaga el usuario ya
 * validado vía el header `x-user-email`, para que los Server Components no
 * tengan que volver a verificar la sesión.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getClaims() verifica el JWT localmente (JWKS cacheado en el proceso) en
  // vez de hacer un round-trip de red a Supabase Auth como getUser() — esto
  // corre en CADA navegación del panel, así que el ahorro es enorme.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!claims && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (claims && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (claims) {
    request.headers.set("x-user-email", typeof claims.email === "string" ? claims.email : "");
  } else {
    request.headers.delete("x-user-email");
  }

  const finalResponse = NextResponse.next({ request });
  for (const cookie of supabaseResponse.cookies.getAll()) {
    finalResponse.cookies.set(cookie);
  }

  return finalResponse;
}
