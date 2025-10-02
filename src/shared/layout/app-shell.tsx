"use client";

import NavBar from "@/shared/layout/nav-bar";
import CartAside from "@/shared/cart/cart-aside";
import React from "react";
import { usePathname } from "next/navigation";

type MinimalCategory = { documentId?: string; type: string };

type AppShellProps = {
  categories?: Array<MinimalCategory>;
  children: React.ReactNode;
};

export default function AppShell({ categories = [], children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  return (
    <>
      {!isAdminRoute && <NavBar categories={categories} />}
      <CartAside />
      <main className={!isAdminRoute ? "mt-16 sm:mt-[72px] lg:mt-20" : undefined}>
        {children}
      </main>
    </>
  );
}


