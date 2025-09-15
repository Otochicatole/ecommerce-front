// Logout de administrador: borra la cookie que guarda el token
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("admin_token", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}


