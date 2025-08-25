'use client';
import Link from "next/link";
import { useEffect } from "react";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.assign("/"); // Redirect after 5 seconds
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>pago aprobado</h2>
      <p>te redirigimos al inicio en 5 segundos...</p>
      <Link href="/">ir ahora</Link>
    </div>
  );
}


