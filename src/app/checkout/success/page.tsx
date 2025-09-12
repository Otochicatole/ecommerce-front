'use client';
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/shared/cart/cart-context";

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
    <div style={{ padding: 24 }}>
      <h2>pago aprobado</h2>
      <p>te redirigimos al inicio en 5 segundos...</p>
      <Link href="/">ir ahora</Link>
    </div>
  );
}


