"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/shared/auth/admin-auth-context";
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";
import styles from "@/styles/shared/admin-page-actions.module.css";

export default function AdminPageActions() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, logout, loading } = useAdminAuth();

  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isAdminRoot = pathname === "/admin";
  if (!isAdminRoute) return null;

  return (
    <div className={styles.container}>
      {!isAdminRoot && (
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className={styles.backButton}
        >
          <ArrowLeftIcon className={styles.icon} />
          Volver al panel
        </button>
      )}
      {!loading && isAdmin && (
        <button
          type="button"
          onClick={async () => { await logout(); router.replace('/'); }}
          className={styles.logoutButton}
        >
          <LogOutIcon className={styles.icon} />
          Cerrar sesión
        </button>
      )}
    </div>
  );
}


