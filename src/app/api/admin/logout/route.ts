// Logout de administrador
// - Borra la cookie de sesión en el lado del servidor
// - La UI se actualizará por el contexto al quedar sin usuario
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/shared/auth/cookie";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}


