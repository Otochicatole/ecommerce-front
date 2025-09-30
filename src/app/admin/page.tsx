"use client";
import Link from "next/link";
import { Package, ShoppingCart, FilePlus2, Boxes } from "lucide-react";


export default function AdminDashboardPage() {

  const cards: Array<{ href: string; label: string; desc: string; Icon: React.ComponentType<{ size?: number }> }> = [
    { href: "/admin/stock", label: "Stock", desc: "ver y gestionar inventario", Icon: Boxes },
    { href: "/admin/sell", label: "Sell", desc: "ventas presenciales", Icon: ShoppingCart },
    { href: "/admin/sales", label: "Sales", desc: "listado de ventas", Icon: Package },
    { href: "/admin/create", label: "Create product", desc: "crear nuevo producto", Icon: FilePlus2 },
  ];

  return (
    <main className="p-6 relative">
      <h1 className="text-2xl font-bold mb-6">Panel admin</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ href, label, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-3xl bg-white/80 backdrop-blur-xl ring-1 ring-black/5 shadow hover:shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="p-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-md">
                <Icon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}


