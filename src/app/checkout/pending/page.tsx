import Link from "next/link";

export default function CheckoutPendingPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>pago pendiente</h2>
      <p>tu pago está siendo procesado. te avisamos cuando se acredite.</p>
      <Link href="/">volver al inicio</Link>
    </div>
  );
}


