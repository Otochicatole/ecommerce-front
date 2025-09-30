'use client';
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/shared/cart/cart-context";

function StatusIconSuccess() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#34C759" />
      <path d="M7 12.5l3 3 7-7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckoutSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart on success to avoid duplicates after returning
    try { clearCart(); } catch {}
    const timer = setTimeout(() => {
      window.location.assign("/");
    }, 5000);
    return () => clearTimeout(timer);
  }, [clearCart]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, backgroundColor: "#ffffff", color: "#111111" }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ borderRadius: 9999, padding: 8, boxShadow: "0 6px 20px rgba(52,199,89,0.35)" }}>
            <StatusIconSuccess />
          </div>
        </div>
        <h2 style={{ fontSize: 28, margin: 0, marginBottom: 8, fontWeight: 700 }}>Pago aprobado</h2>
        <p style={{ color: "#6B7280", margin: 0, marginBottom: 20 }}>Te redirigimos al inicio en 5 segundos</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link href="/" style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: 12,
            background: "#007AFF",
            color: "#ffffff",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,122,255,0.2)",
            border: "1px solid rgba(0,0,0,0.04)"
          }}>Ir ahora</Link>
        </div>
      </div>
    </div>
  );
}


