// app/api/payments/mp/preference/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  currency_id: z.string().min(3).max(3),
});

const Schema = z.object({ product: ProductSchema });

export async function POST(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const isHttpsOrigin = /^https:\/\//.test(origin);

  try {
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN en el entorno" },
        { status: 500 }
      );
    }
    const data = await req.json();
    const parsed = Schema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const { product } = parsed.data;
    const items = [product];
    const external_reference = `order_${product.id}_${Date.now()}`;

    // 2) Crea la preference (REST oficial de MP)
    const preferencePayload: Record<string, unknown> = {
      items,
      external_reference,
      metadata: { productId: product.id },
    };

    // Always provide back_urls so MP can redirect back
    Object.assign(preferencePayload, {
      back_urls: {
        success: `${origin}/checkout/success`,
        failure: `${origin}/checkout/failure`,
        pending: `${origin}/checkout/pending`,
      },
    });

    // Only enable auto_return and notifications on https (prod)
    if (isHttpsOrigin) {
      Object.assign(preferencePayload, {
        auto_return: "approved",
        notification_url: `${origin}/api/webhooks/mercadopago`,
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
