// Webhook de Mercado Pago
// -----------------------------------------------------------------------------
// Responsabilidades de este endpoint:
// - Recibir notificaciones HTTP (POST) enviadas por Mercado Pago hacia
//   `notification_url` configurada en la preference o en el panel de MP.
// - Leer el body crudo (sin parsear) para poder validar firma HMAC si hay
//   una clave secreta configurada.
// - Validar autenticidad de la notificación (opcional) usando HMAC-SHA256 con
//   el secreto `MP_WEBHOOK_SECRET` y el header `x-hub-signature-256` o `x-signature`.
// - Extraer robustamente el `paymentId` (MP puede mandarlo en `data.id`,
//   `resource.id`, `resource` como string o en query string).
// - Si el evento parece de pago, consultar `GET /v1/payments/{id}` para obtener
//   detalles y loguear el estado (`status`, `status_detail`, `external_reference`).
// - Responder SIEMPRE 200 para que MP considere entregada la notificación
//   (aún si se descarta por firma inválida). El procesamiento extra puede ser
//   asincrónico en otra capa si se necesita.
//
// Variables de entorno relevantes:
// - MP_ACCESS_TOKEN: requerido para consultar pagos en la API de MP.
// - MP_WEBHOOK_SECRET: opcional, si está presente se exige firma válida.
//
// Formas típicas del payload de MP (ejemplos simplificados):
// - { "type": "payment", "data": { "id": "123" } }
// - { "topic": "payment", "resource": "/v1/payments/123" }
// - { "action": "payment.created", "id": 123 }
// MP también puede incluir parámetros en la query (fallback), p. ej. `?type=payment&id=123`.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Forzamos runtime Node para disponer de APIs como crypto y asegurar compatibilidad
export const runtime = "nodejs";

function pickHeaders(headers: Headers) {
  // Seleccionamos solo los headers relevantes para trazabilidad y firma
  return {
    "x-hub-signature-256": headers.get("x-hub-signature-256"),
    "x-signature": headers.get("x-signature"),
    "x-request-id": headers.get("x-request-id"),
    "user-agent": headers.get("user-agent"),
  } as const;
}

type MercadoPagoWebhookPayload = {
  // MP puede enviar distintos campos según el tipo de evento
  type?: string;
  topic?: string;
  action?: string;
  id?: string | number;
  data?: { id?: string | number } | null;
  resource?: { id?: string | number } | string | null;
  [key: string]: unknown;
};

function isMercadoPagoPayload(value: unknown): value is MercadoPagoWebhookPayload {
  // Guard simple para evitar acceder a propiedades de null/undefined
  return typeof value === "object" && value !== null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  // Comparación segura en tiempo constante para hashes hexadecimales
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
  // Verifica firma HMAC-SHA256 del body crudo con el secreto configurado en MP
  // Formatos aceptados: "sha256=<hex>" o directamente el hex
  if (!headerValue) return false;
  // Accept formats like: "sha256=deadbeef" or plain hex
  const match = headerValue.match(/sha256=(.+)/i);
  const providedHex = match ? match[1] : headerValue.trim();
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return timingSafeEqualHex(providedHex, computed);
}

function extractPaymentId(payload: MercadoPagoWebhookPayload | undefined, searchParams: URLSearchParams): string | null {
  // Extrae el paymentId desde múltiples variantes que puede enviar MP
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
    // Leemos el body crudo para poder validar firma HMAC correctamente
    let rawBody = "";
    try {
      rawBody = await request.text();
    } catch (readErr) {
      // Toleramos errores de lectura; continuamos con body vacío
      console.error("mercadopago-webhook: failed to read body", readErr);
    }

    let parsedBody: unknown = undefined;
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
    } catch {
      // Si no es JSON, dejamos el body crudo para debugging
    }

    const headers = pickHeaders(request.headers);

    // Normalizamos campos de interés del payload
    const bodyObj: MercadoPagoWebhookPayload | undefined = isMercadoPagoPayload(parsedBody) ? parsedBody : undefined;
    const query = request.nextUrl.searchParams;

    const eventType = bodyObj?.type || bodyObj?.topic || bodyObj?.action || query.get("type") || query.get("topic") || "unknown";
    const dataId = extractPaymentId(bodyObj, query);

    // Verificación de firma opcional si existe MP_WEBHOOK_SECRET
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    const verified = webhookSecret
      ? verifyHmacSha256(rawBody, headers["x-hub-signature-256"] || headers["x-signature"], webhookSecret)
      : null;

    // Logging estructurado para observabilidad y auditoría
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

    // Si hay secreto configurado y la firma no valida, no procesamos el evento
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

    // Si el evento es de pago y tenemos id, consultamos detalles del pago en MP
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

    // Siempre respondemos 200 rápido; el procesamiento extra puede ser asíncrono
    return NextResponse.json({ received: true, eventType, dataId }, { status: 200 });
  } catch (err) {
    // Nunca fallamos el endpoint; registramos y confirmamos recepción
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


