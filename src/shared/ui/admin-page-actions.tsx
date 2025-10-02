"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/shared/auth/admin-auth-context";
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";

export default function AdminPageActions() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, logout, loading } = useAdminAuth();

  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isAdminRoot = pathname === "/admin";
  if (!isAdminRoute) return null;

  return (
    <div className="flex items-center gap-2">
      {!isAdminRoot && (
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="px-3 py-2 flex items-center cursor-pointer text-xs sm:text-sm border rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Volver al panel
        </button>
      )}
      {!loading && isAdmin && (
        <button
          type="button"
          onClick={async () => { await logout(); router.replace('/'); }}
          className="px-3 py-2 flex items-center cursor-pointer text-xs sm:text-sm border border-red-500 rounded-md hover:bg-red-500 text-red-500 hover:text-white transition-colors"
        >
          <LogOutIcon className="w-4 h-4 mr-2" />
          Cerrar sesión
        </button>
      )}
    </div>
  );
}


