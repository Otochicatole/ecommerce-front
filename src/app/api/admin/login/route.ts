// Login de administrador
// - Recibe credenciales desde el cliente
// - Llama al endpoint de Strapi Admin API (/admin/login)
// - Si es exitoso, setea una cookie HttpOnly endurecida con el token
// - Devuelve un shape mínimo para la UI
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import http from "@/config/http";
import axios from "axios";
import { z } from "zod";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_OPTS } from "@/shared/auth/cookie";

// Simple in-memory rate limit per IP for this server instance.
// For multi-instance deployments, replace with a shared store (Redis).
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 10;
const attempts: Map<string, { count: number; resetAt: number }> = new Map();

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
    // Basic IP-based rate limit
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '')
      .split(',')[0]
      .trim() || 'unknown';
    const now = Date.now();
    const current = attempts.get(ip);
    if (!current || current.resetAt < now) {
      attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      current.count += 1;
      if (current.count > MAX_ATTEMPTS) {
        const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
        return NextResponse.json({ error: "Too many attempts. Try again later." }, {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        });
      }
    }

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
    cookieStore.set(ADMIN_COOKIE_NAME, token, ADMIN_COOKIE_OPTS);

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


