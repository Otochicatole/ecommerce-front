// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

type MpWebhookBody = {
  type?: string; // "payment" | "merchant_order" | others
  action?: string;
  data?: { id?: string };
};

// Minimal shapes for MP responses (only fields we read)
interface MpPayment {
  id: string | number;
  status: string;
  external_reference?: string;
  metadata?: { orderId?: string };
}

interface MpMerchantOrderPayment {
  id: string | number;
  status: string;
}

interface MpMerchantOrder {
  id: string | number;
  external_reference?: string;
  payments?: MpMerchantOrderPayment[];
}

function parseSignatureHeader(signatureHeader: string | null): { ts: string; v1: string } | null {
  if (!signatureHeader) return null;
  // Format: ts=1699999999,v1=hexhash
  const parts = signatureHeader.split(",").map((s) => s.trim());
  const kv = Object.fromEntries(parts.map((p) => p.split("=")));
  if (!kv.ts || !kv.v1) return null;
  return { ts: kv.ts, v1: kv.v1 };
}

function verifySignature(headers: Headers, resourceId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // signature verification disabled
  const signatureHeader = headers.get("x-signature");
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;

  const { ts, v1 } = parsed;
  const content = `${resourceId}:${ts}`;
  const expected = crypto.createHmac("sha256", secret).update(content).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

async function fetchFromMP<T>(path: string): Promise<{ ok: boolean; status: number; data?: T }> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { ok: false, status: 500 };
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as T;
  return { ok: true, status: res.status, data };
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN" }, { status: 500 });

    const url = new URL(req.url);
    const search = url.searchParams;

    let body: MpWebhookBody | null = null;
    try {
      body = (await req.json()) as MpWebhookBody;
    } catch {
      body = null; // allow query-string based notifications
    }

    // Support both notification formats
    const type = body?.type ?? search.get("type") ?? search.get("topic") ?? undefined;
    const id = body?.data?.id ?? search.get("id") ?? undefined;

    if (!type || !id) {
      return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
    }

    if (!verifySignature(req.headers, id)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Resolve to a definitive resource and status
    let externalReference: string | undefined;
    let approved = false;

    if (type === "payment") {
      const p = await fetchFromMP<MpPayment>(`/v1/payments/${id}`);
      if (!p.ok) return NextResponse.json({ error: "MP payment fetch error" }, { status: 502 });
      const payment = p.data!;
      approved = payment.status === "approved";
      externalReference = payment.external_reference || payment.metadata?.orderId;
    } else if (type === "merchant_order") {
      const mo = await fetchFromMP<MpMerchantOrder>(`/merchant_orders/${id}`);
      if (!mo.ok) return NextResponse.json({ error: "MP order fetch error" }, { status: 502 });
      const order = mo.data!;
      externalReference = order.external_reference;
      approved = Array.isArray(order.payments)
        ? order.payments.some((p: MpMerchantOrderPayment) => p.status === "approved")
        : false;
    } else {
      // Fallback: try payment, then merchant_order
      const p = await fetchFromMP<MpPayment>(`/v1/payments/${id}`);
      if (p.ok) {
        const payment = p.data!;
        approved = payment.status === "approved";
        externalReference = payment.external_reference || payment.metadata?.orderId;
      } else {
        const mo = await fetchFromMP<MpMerchantOrder>(`/merchant_orders/${id}`);
        if (!mo.ok) return NextResponse.json({ error: "MP fetch error" }, { status: 502 });
        const order = mo.data!;
        externalReference = order.external_reference;
        approved = Array.isArray(order.payments)
          ? order.payments.some((p: MpMerchantOrderPayment) => p.status === "approved")
          : false;
      }
    }

    // TODO: persist the result in your DB here (idempotent upsert by externalReference)
    console.log("MP webhook processed", { type, id, approved, externalReference });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function GET() {
  // For MP tests that ping with GET
  return NextResponse.json({ ok: true });
}


