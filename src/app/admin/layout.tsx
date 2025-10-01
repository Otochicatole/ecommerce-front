// Guard de servidor para el área /admin
// - Evita renderizar contenido admin si el token no es válido
// - Valida en cada request contra Strapi
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import env from "@/config";
import { ADMIN_COOKIE_NAME } from "@/shared/auth/cookie";
import AdminBackBar from "@/shared/ui/admin-back-bar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  // Leemos la cookie firmada HttpOnly que guardamos en el login
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login?redirect=" + encodeURIComponent("/admin"));
  }

  try {
    // Validamos contra Strapi Admin API. Si 401/403, el token es inválido
    const res = await fetch(`${env.strapiUrl}/admin/users/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      // clear invalid cookie and redirect
      cookieStore.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
      redirect("/login?redirect=" + encodeURIComponent("/admin"));
    }
  } catch {
    // invalid/expired token
    cookieStore.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    redirect("/login?redirect=" + encodeURIComponent("/admin"));
  }

  return (
    <div className="min-h-screen">
      {/* Minimal admin back bar on subroutes */}
      <AdminBackBar />
      {children}
    </div>
  );
}


