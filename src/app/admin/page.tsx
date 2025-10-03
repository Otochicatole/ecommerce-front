"use client";
import Link from "next/link";
import AdminPageActions from "@/shared/ui/admin-page-actions";
import { Package, ShoppingCart, FilePlus2, Boxes } from "lucide-react";
import styles from "@/styles/admin/dashboard.module.css";

export default function AdminDashboardPage() {
  const cards: Array<{ 
    href: string; 
    label: string; 
    desc: string; 
    Icon: React.ComponentType<{ size?: number }> 
  }> = [
    { href: "/admin/stock", label: "Stock", desc: "ver y gestionar inventario", Icon: Boxes },
    { href: "/admin/sell", label: "Sell", desc: "ventas presenciales", Icon: ShoppingCart },
    { href: "/admin/sales", label: "Sales", desc: "listado de ventas", Icon: Package },
    { href: "/admin/create", label: "Create product", desc: "crear nuevo producto", Icon: FilePlus2 },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panel admin</h1>
        <AdminPageActions />
      </div>
      
      <div className={styles.grid}>
        {cards.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.iconWrapper}>
                <Icon size={24} />
              </div>
              <div className={styles.cardInfo}>
                <h2 className={styles.cardLabel}>{label}</h2>
                <p className={styles.cardDesc}>{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}


