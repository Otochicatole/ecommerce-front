'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/shared/cart/cart-context";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // get order ID from query params (external_reference)
    const externalRef = searchParams.get('external_reference');
    if (externalRef) setOrderId(externalRef);

    // Clear cart on success to avoid duplicates after returning
    try { clearCart(); } catch {}
  }, [clearCart, searchParams]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, backgroundColor: "#ffffff", color: "#111111" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ borderRadius: 9999, padding: 8, boxShadow: "0 6px 20px rgba(52,199,89,0.35)" }}>
            <StatusIconSuccess />
          </div>
        </div>
        <h2 style={{ fontSize: 28, margin: 0, marginBottom: 8, fontWeight: 700 }}>pago aprobado</h2>
        <p style={{ color: "#6B7280", margin: 0, marginBottom: 20 }}>tu compra se procesó correctamente</p>

        {orderId && (
          <div style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            textAlign: "left"
          }}>
            <p style={{ margin: 0, marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#166534" }}>
              número de orden
            </p>
            <p style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 18,
              fontWeight: 700,
              color: "#15803D",
              fontFamily: "monospace",
              letterSpacing: 1
            }}>
              {orderId}
            </p>
            <div style={{ borderTop: "1px solid #BBF7D0", paddingTop: 12 }}>
              <p style={{ margin: 0, marginBottom: 4, fontSize: 13, fontWeight: 600, color: "#166534" }}>
                importante para retirar tu pedido:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                <li>guardá este número de orden</li>
                <li>llevá tu DNI y el comprobante de pago</li>
                <li>la entrega es en persona previa coordinación</li>
              </ul>
            </div>
          </div>
        )}

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
          }}>volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}


