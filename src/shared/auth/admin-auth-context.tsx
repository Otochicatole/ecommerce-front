"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

// Representa el usuario del panel de administración de Strapi
interface AdminUser {
  id?: string | number;
  email?: string;
  username?: string;
  roles?: Array<{ code?: string; name?: string }>;
}

// API pública del contexto de autenticación de administrador
interface AdminAuthContextValue {
  user: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (params: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Revalida contra /api/admin/me si el token sigue siendo válido
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.authenticated) {
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Revalidación automática en cambios de ruta, foco de ventana y visibilidad
  useEffect(() => {
    refresh();
    // focus/visibility
    function handleFocus() { refresh(); }
    function handleVisibility() { if (document.visibilityState === 'visible') refresh(); }
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname, refresh]);

  // Cierra sesión y limpia estado local
  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setUser(null);
  }, []);

  // Idle timeout: cierra sesión tras 1 hora sin interacción
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { void logout(); }, 60 * 60 * 1000);
    };
    const events = ['click','keydown','mousemove','scroll','focus'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [logout]);

  // Realiza login (server setea cookie HttpOnly) y refresca estado
  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      await refresh();
      return true;
    }
    return false;
  }, [refresh]);


  // Si existe usuario proveniente de /admin/me, se asume admin
  const isAdmin = useMemo(() => {
    return Boolean(user);
  }, [user]);

  const value: AdminAuthContextValue = useMemo(() => ({ user, isAdmin, loading, login, logout, refresh }), [user, isAdmin, loading, login, logout, refresh]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}


