// Middleware de Edge
// - Reescribe la ruta pública de webhooks a la API interna
// - Protege todo /admin
//   1) Si no hay cookie admin_token -> redirige a /login
//   2) Si hay cookie, valida contra /api/admin/me con las cookies del request
//      y solo deja pasar si authenticated === true
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Reescritura de webhooks para permitir body raw en el handler interno
  if (pathname === "/webhooks/mercadopago" || pathname === "/webhooks/mercadopago/") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/webhooks/mercadopago";
    return NextResponse.rewrite(url);
  }

  // Protección de la sección admin: requiere cookie y validación del token
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Validación del token contra nuestro endpoint server-side (consulta Strapi)
    try {
      const meUrl = new URL("/api/admin/me", request.url);
      const res = await fetch(meUrl.toString(), {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") ?? "",
        },
        // Avoid caching at the edge
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({ authenticated: false }));
      if (!data?.authenticated) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/webhooks/mercadopago",
    "/webhooks/mercadopago/",
    "/admin/:path*",
  ],
};


