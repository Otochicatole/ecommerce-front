'use client';
import { Wallet, initMercadoPago } from "@mercadopago/sdk-react";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react"

export default function TestPage() {
    const [preferenceId, setPreferenceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
        initMercadoPago(publicKey as string);
        console.log(publicKey);
    }, []);


    const getPreference = async () => {
        setLoading(true);
        try {
            const items = [
                {
                    id: "SKU-TEST-001",
                    title: "Zapatillas Negras",
                    quantity: 1,
                    unit_price: 100,
                    currency_id: "ARS",
                },
                {
                    id: "SKU-TEST-002",
                    title: "Zapatillas Blancas",
                    quantity: 1,
                    unit_price: 100,
                    currency_id: "ARS",
                },
                {
                    id: "SKU-TEST-003",
                    title: "Zapatillas Rojas",
                    quantity: 1,
                    unit_price: 100,
                    currency_id: "ARS",
                }
            ];
            const { data } = await axios.post("/api/payments/mp/preference", { items });
            if (data?.preferenceId) setPreferenceId(data.preferenceId);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const axErr = err as AxiosError;
                if (axErr.response) {
                    console.error("Axios response error", axErr.response.status, axErr.response.data);
                } else if (axErr.request) {
                    console.error("Axios request error", axErr.message);
                } else {
                    console.error("Axios config error", axErr.message);
                }
            } else {
                console.error("Unexpected error", err);
            }
        } finally {
            setLoading(false);
        }
      };
    
      return (
        <div className="space-y-3">
          {!preferenceId ? (
            <button onClick={getPreference} disabled={loading} className="btn-primary">
              {loading ? "Preparando..." : "Pagar con Mercado Pago"}
            </button>
          ) : (
            <Wallet initialization={{ preferenceId, redirectMode: "self" }} />
          )}
        </div>
    )
}

// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from "next/server";

type MpWebhookBody = {
  type?: string;
  action?: string;
  data?: { id?: string };
};

// Minimal shapes for MP responses (only fields we read)
// (kept minimal for future use)

// (kept minimal for future use)

// (kept minimal for future use)

// NOTE: Simplified webhook: receive and acknowledge only (no validation, no external calls)

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    let body: MpWebhookBody | null = null;
    try { body = raw ? JSON.parse(raw) : null; } catch {}
    const url = new URL(req.url);
    let type = body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? undefined;
    let id = body?.data?.id ?? url.searchParams.get("id") ?? undefined;
    const resource = url.searchParams.get("resource");
    if ((!type || !id) && resource) {
      try {
        const u = new URL(resource);
        const parts = u.pathname.split("/").filter(Boolean); // e.g. v1, payments, 123
        const maybeType = parts[1];
        const maybeId = parts[2];
        if (!id && maybeId) id = maybeId;
        if (!type && maybeType) type = maybeType === "payments" ? "payment" : maybeType;
      } catch {}
    }
    console.log("MP webhook received", { method: "POST", type, id, resource, hasBody: Boolean(body) });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
}
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let type = url.searchParams.get("type") ?? url.searchParams.get("topic") ?? undefined;
    let id = url.searchParams.get("id") ?? undefined;
    const resource = url.searchParams.get("resource");
    if ((!type || !id) && resource) {
      try {
        const u = new URL(resource);
        const parts = u.pathname.split("/").filter(Boolean);
        const maybeType = parts[1];
        const maybeId = parts[2];
        if (!id && maybeId) id = maybeId;
        if (!type && maybeType) type = maybeType === "payments" ? "payment" : maybeType;
      } catch {}
    }
    console.log("MP webhook received", { method: "GET", type, id, resource });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}


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

const Schema = z.object({ items: z.array(ProductSchema).min(1) });

export async function POST(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const isHttpsOrigin = /^https:\/\//.test(origin);
  const explicitWebhookUrl = process.env.MP_WEBHOOK_URL;

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

    const { items } = parsed.data;
    const external_reference = `order_${Date.now()}`;

    // 2) Crea la preference (REST oficial de MP)
    const preferencePayload: Record<string, unknown> = {
      items,
      external_reference,
      metadata: { productIds: items.map(i => i.id) },
    };

    // Always provide back_urls so MP can redirect back
    Object.assign(preferencePayload, {
      back_urls: {
        success: `${origin}/checkout/success`,
        failure: `${origin}/checkout/failure`,
        pending: `${origin}/checkout/pending`,
      },
    });

    // Notification URL: prefer explicit env (works for tunnels), else only if https origin
    const webhookUrl = explicitWebhookUrl ?? (isHttpsOrigin ? `${origin}/api/webhooks/mercadopago` : undefined);
    if (webhookUrl) Object.assign(preferencePayload, { notification_url: webhookUrl });

    // debug log: verify where MP will notify
    try {
      console.log("Creating MP preference", {
        external_reference,
        notification_url: webhookUrl ?? null,
        back_urls: (preferencePayload as any).back_urls,
      });
    } catch {}

    // Auto return only for https origin
    if (isHttpsOrigin) Object.assign(preferencePayload, { auto_return: "approved" });

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
    try { console.log("MP preference created", { id: pref.id, external_reference }); } catch {}
    return NextResponse.json({ preferenceId: pref.id, notificationUrl: webhookUrl ?? null });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
