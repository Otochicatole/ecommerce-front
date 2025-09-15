// Endpoint de introspección de sesión de admin
// - Lee el token de la cookie HttpOnly
// - Valida contra Strapi (/admin/users/me)
// - Si falla, limpia la cookie y responde authenticated: false
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import http from "@/config/http";
import { ADMIN_COOKIE_NAME } from "@/shared/auth/cookie";

interface AdminMeResponse {
  id?: number | string;
  email?: string;
  username?: string;
  // other fields are ignored for UI purposes
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Validamos token contra el endpoint oficial de Strapi Admin API
    const { data } = await http.get<AdminMeResponse>("/admin/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return NextResponse.json({ authenticated: true, user: (data as AdminMeResponse) ?? null });
  } catch {
    // If token invalid/expired, clear cookie and respond unauthenticated
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}


