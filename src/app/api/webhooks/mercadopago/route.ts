import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function pickHeaders(headers: Headers) {
  return {
    "x-hub-signature-256": headers.get("x-hub-signature-256"),
    "x-signature": headers.get("x-signature"),
    "x-request-id": headers.get("x-request-id"),
    "user-agent": headers.get("user-agent"),
  } as const;
}

type MercadoPagoWebhookPayload = {
  type?: string;
  topic?: string;
  action?: string;
  id?: string | number;
  data?: { id?: string | number } | null;
  resource?: { id?: string | number } | string | null;
  [key: string]: unknown;
};

function isMercadoPagoPayload(value: unknown): value is MercadoPagoWebhookPayload {
  return typeof value === "object" && value !== null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function verifyHmacSha256(rawBody: string, headerValue: string | null, secret: string): boolean {
  if (!headerValue) return false;
  // Accept formats like: "sha256=deadbeef" or plain hex
  const match = headerValue.match(/sha256=(.+)/i);
  const providedHex = match ? match[1] : headerValue.trim();
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return timingSafeEqualHex(providedHex, computed);
}

function extractPaymentId(payload: MercadoPagoWebhookPayload | undefined, searchParams: URLSearchParams): string | null {
  if (!payload) {
    return searchParams.get("id");
  }

  const idFromData = payload.data && typeof payload.data.id !== "undefined" ? String(payload.data.id) : null;
  if (idFromData) return idFromData;

  const idFromResourceObj = typeof payload.resource === "object" && payload.resource && "id" in payload.resource
    ? String((payload.resource as { id?: string | number }).id ?? "")
    : null;
  if (idFromResourceObj) return idFromResourceObj;

  if (typeof payload.resource === "string" && payload.resource.includes("/v1/payments/")) {
    const parts = payload.resource.split("/v1/payments/");
    if (parts[1]) return parts[1].split(/[/?#]/)[0];
  }

  const idField = typeof payload.id !== "undefined" ? String(payload.id) : null;
  if (idField) return idField;

  return searchParams.get("id");
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for potential signature verification later
    let rawBody = "";
    try {
      rawBody = await request.text();
    } catch (readErr) {
      // tolerate read errors; continue with empty body
      console.error("mercadopago-webhook: failed to read body", readErr);
    }

    let parsedBody: unknown = undefined;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
    } catch {
      // keep raw body for debugging; not JSON
    }

    const headers = pickHeaders(request.headers);

    // Normalize relevant fields sent by Mercado Pago
    const bodyObj: MercadoPagoWebhookPayload | undefined = isMercadoPagoPayload(parsedBody) ? parsedBody : undefined;
    const query = request.nextUrl.searchParams;

    const eventType = bodyObj?.type || bodyObj?.topic || bodyObj?.action || query.get("type") || query.get("topic") || "unknown";
    const dataId = extractPaymentId(bodyObj, query);

    // Optional signature verification
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    const verified = webhookSecret
      ? verifyHmacSha256(rawBody, headers["x-hub-signature-256"] || headers["x-signature"], webhookSecret)
      : null;

    // Structured logging
    console.log(
      JSON.stringify(
        {
          source: "mercadopago-webhook",
          method: "POST",
          path: request.nextUrl.pathname,
          eventType,
          dataId,
          headers,
          signatureRequired: Boolean(webhookSecret),
          signatureVerified: verified,
          body: bodyObj ?? null,
        },
        null,
        2,
      ),
    );

    // Enforce signature when a secret is configured
    if (webhookSecret && verified === false) {
      console.warn(
        JSON.stringify(
          {
            source: "mercadopago-webhook",
            message: "Invalid signature, skipping processing",
            eventType,
            dataId,
          },
          null,
          2,
        ),
      );
      return NextResponse.json({ received: true, skipped: "invalid-signature" }, { status: 200 });
    }

    // If we have a payment event with id, fetch details from MP
    const looksLikePayment = ["payment", "payments"].some((t) => String(eventType).toLowerCase().includes(t));
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (looksLikePayment && dataId && accessToken) {
      try {
        const resp = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          next: { revalidate: 0 },
        });
        const payment = await resp.json().catch(() => ({} as unknown));
        console.log(
          JSON.stringify(
            {
              source: "mercadopago-webhook",
              message: "Fetched payment",
              id: dataId,
              status: payment?.status ?? null,
              status_detail: payment?.status_detail ?? null,
              external_reference: payment?.external_reference ?? null,
              order: payment?.order ?? null,
            },
            null,
            2,
          ),
        );
      } catch (fetchErr) {
        console.error("mercadopago-webhook: error fetching payment", fetchErr);
      }
    }

    // Always acknowledge with 200 quickly; processing can be async later
    return NextResponse.json({ received: true, eventType, dataId }, { status: 200 });
  } catch (err) {
    // Never fail the webhook endpoint; acknowledge and log
    console.error("mercadopago-webhook: unhandled error", err);
    return NextResponse.json({ received: true, error: "logged" }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  const headers = pickHeaders(request.headers);
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());

  console.log(
    JSON.stringify(
      {
        source: "mercadopago-webhook",
        method: "GET",
        path: request.nextUrl.pathname,
        query,
        headers,
      },
      null,
      2,
    ),
  );

  return NextResponse.json({ received: true, query }, { status: 200 });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}


