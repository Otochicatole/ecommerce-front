// Página de login de administrador
// Envía credenciales al endpoint server-side y, si todo ok,
// redirige a la ruta pasada por query (?redirect=/admin/stock)
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/shared/auth/admin-auth-context";

export default function Page() {
  const { login, loading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const qp = searchParams.get("redirect") || "/admin";
  const redirect = qp.startsWith("/") ? qp : "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ok = await login({ email, password });
    if (ok) {
      router.replace(redirect);
    } else {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6 shadow">
        <h1 className="text-2xl font-semibold">Admin login</h1>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-md px-3 py-2"
            placeholder="admin@example.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-md px-3 py-2"
            placeholder="••••••••"
            required
          />
        </div>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}