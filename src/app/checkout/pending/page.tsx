import Link from "next/link";

function StatusIconPending() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFCC00" />
      <path d="M12 6v6l4 2" stroke="#3b3b3b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckoutPendingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, backgroundColor: "#ffffff", color: "#111111" }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ borderRadius: 9999, padding: 8, boxShadow: "0 6px 20px rgba(255,204,0,0.35)" }}>
            <StatusIconPending />
          </div>
        </div>
        <h2 style={{ fontSize: 28, margin: 0, marginBottom: 8, fontWeight: 700 }}>Pago pendiente</h2>
        <p style={{ color: "#6B7280", margin: 0, marginBottom: 20 }}>Tu pago está siendo procesado. te avisamos cuando se acredite</p>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link href="/" style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: 12,
            background: "#EFEFF4",
            color: "#111111",
            textDecoration: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.06)"
          }}>volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}


