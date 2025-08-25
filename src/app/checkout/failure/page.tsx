import Link from "next/link";

export default function CheckoutFailurePage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>pago fallido</h2>
      <p>hubo un problema procesando tu pago.</p>
      <Link href="/">volver al inicio</Link>
    </div>
  );
}


