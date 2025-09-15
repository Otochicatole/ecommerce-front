// Login de administrador
// Proxy a Strapi Admin API y setea cookie HttpOnly con el token
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import http from "@/config/http";
import axios from "axios";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

interface StrapiAdminLoginResponse {
  data?: {
    token?: string;
    user?: unknown;
  };
  token?: string;
  user?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Hacemos login contra Strapi desde el servidor
    const { data } = await http.post<StrapiAdminLoginResponse>("/admin/login", { email, password });

    const token: string | undefined = data?.data?.token ?? data?.token;
    const user = data?.data?.user ?? data?.user ?? null;

    if (!token) {
      return NextResponse.json({ error: "Invalid login response" }, { status: 502 });
    }

    // Guardamos cookie segura HttpOnly para que el cliente no pueda leerla
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error: unknown) {
    if ((error as { name?: string })?.name === "ZodError") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const message = (error.response?.data as { error?: string } | undefined)?.error ?? "Login failed";
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}


