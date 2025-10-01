"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/shared/ui/button";
import styles from "@/styles/shared/admin-nav.module.css";
import { useAdminAuth } from "@shared/auth/admin-auth-context";
import { ArrowLeftIcon, LogOutIcon } from "lucide-react";

export default function AdminBackBar() {
    const { isAdmin, logout, loading } = useAdminAuth();
    const pathname = usePathname();
    const router = useRouter();

    const isAdminRoute = pathname?.startsWith("/admin") ?? false;
    const isAdminRoot = pathname === "/admin";

    if (!isAdminRoute) return null;

    return (
        <div className={styles.container}>
            {!isAdminRoot && (
                <Button variant="secondary" onClick={() => router.push("/admin")}>
                    <ArrowLeftIcon className="w-4 h-4 mr-3" />
                    Volver al panel
                </Button>
            )}
            <div className={styles.spacer} />

            <div className='mx-auto max-w-screen-xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-end'>
                {!loading && (
                    isAdmin && (
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={async () => { await logout(); router.replace('/'); }}
                                className='px-3 py-2 flex flex-row items-center text-sm border border-red-500 rounded-md hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300 cursor-pointer'
                            >
                                <LogOutIcon className="w-4 h-4 mr-3" />
                                Cerrar sesión
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}


