// Endpoint para crear una Preference de Mercado Pago
// -----------------------------------------------------------------------------
// Responsabilidades de este endpoint:
// - Recibir una lista de items a pagar desde el cliente.
// - Validar el payload de entrada (estructura y tipos) con Zod.
// - Construir la `preference` para Checkout Pro/Wallet de MP.
// - Configurar `back_urls` para redirecciones post-checkout.
// - Configurar `notification_url` hacia nuestro webhook para recibir updates.
// - Devolver `preferenceId` al cliente para inicializar el widget de MP.
//
// Variables de entorno relevantes:
// - MP_ACCESS_TOKEN: token privado para crear la preference.
// - NEXT_PUBLIC_SITE_URL: origin HTTPS del front (opcional; si no, se infiere).
// - MP_WEBHOOK_URL: override explícito de `notification_url` (recomendado en prod).
//
// Notas:
// - `external_reference` debería mapear a tu id de orden interno.
// - `auto_return: "approved"` hace que MP redirija automáticamente cuando el pago
//   resulta aprobado.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Esquema de validación para cada producto
const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  currency_id: z.string().min(3).max(3),
});

// Esquema del payer (información del comprador)
const PayerSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().email().optional(),
  identification: z.object({
    type: z.string().optional(),
    number: z.string().optional(),
  }).optional(),
}).optional();

// Esquema del request: lista de items obligatoria
const Schema = z.object({
  items: z.array(ProductSchema).min(1),
  payer: PayerSchema,
  externalReference: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Determinamos origin del sitio para redirecciones y webhook por defecto
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const isHttpsOrigin = /^https:\/\//.test(origin);
  const envWebhookUrl = process.env.MP_WEBHOOK_URL;

  try {
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN en el entorno" },
        { status: 500 }
      );
    }
    // Parseo y validación del body
    const data = await req.json();
    const parsed = Schema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const { items, payer, externalReference } = parsed.data;
    // external_reference debe identificar tu orden internamente
    const external_reference = externalReference ?? `order_${Date.now()}`;

    // Construimos la payload de la preference
    const preferencePayload: Record<string, unknown> = {
      items,
      external_reference,
      metadata: { productIds: items.map(i => i.id) },
    };

    // incluir información del payer si está disponible
    if (payer) {
      Object.assign(preferencePayload, { payer });
    }

    // back_urls para redirecciones post-checkout
    Object.assign(preferencePayload, {
      back_urls: {
        success: `${origin}/checkout/success`,
        failure: `${origin}/checkout/failure`,
        pending: `${origin}/checkout/pending`,
      },
    });

    // notification_url: si hay MP_WEBHOOK_URL lo usamos; sino, si el origin es https, usamos el webhook local
    const webhookUrl = envWebhookUrl ?? (isHttpsOrigin ? `${origin}/api/webhooks/mercadopago` : undefined);
    if (webhookUrl) {
      Object.assign(preferencePayload, {
        auto_return: "approved",
        notification_url: webhookUrl,
      });
    }

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!res.ok) {
      let details: unknown = null;
      try {
        details = await res.json();
      } catch {
        try {
          details = await res.text();
        } catch {}
      }
      console.error("MP preference error:", { status: res.status, details });
      return NextResponse.json(
        { error: "Error al crear preference en Mercado Pago", details, mpStatus: res.status },
        { status: res.status }
      );
    }
    const pref = await res.json();
    return NextResponse.json({ preferenceId: pref.id });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
