// server action para crear una preference de Mercado Pago a partir del carrito del cliente.
// responsabilidades:
// - recibir items del carrito desde el cliente (documentId, productId, size, quantity)
// - consultar a strapi por documentId para obtener datos autoritativos del producto
// - validar identidad del producto (id/documentId) y disponibilidad del talle
// - construir los items de Mercado Pago usando precios verificados del lado servidor
// - loguear la verificación para auditoría
// - llamar a la ruta interna que crea la preference y devolver el preferenceId
'use server';

import { fetchProductByDocumentId } from '@/features/catalog/services/products';
import { headers } from 'next/headers';

// payload de un item que viene del carrito del cliente
// productId: id numérico que ve el cliente; se usa para cruzar identidad
// documentId: id estable de strapi, usado para consultar el producto real
// size: talle/variante solicitada; si viene, debe existir en product.sizes
// quantity: cantidad pedida; debe ser positiva
type CartInputItem = {
  productId: number;
  documentId: string;
  size: string | null;
  quantity: number;
};

// respuesta mínima que devuelve la ruta interna de preference
type PreferenceResponse = {
  preferenceId: string;
};

// crea una preference de Mercado Pago a partir de items validados del carrito.
// lanza error si el carrito está vacío, si falla alguna validación
// o si la API interna de preference responde con error.
export async function createPreferenceFromCart(cartItems: CartInputItem[]): Promise<PreferenceResponse> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // 1) consultar a strapi por documentId para cada item del carrito
  const products = await Promise.all(
    cartItems.map(async (ci) => {
      try {
        const { data } = await fetchProductByDocumentId(ci.documentId);
        return { ci, product: data } as const;
      } catch {
        return { ci, product: null } as const;
      }
    })
  );

  // 2) validar que los datos del servidor coincidan con lo que envió el cliente
  // - el producto debe existir
  // - product.id debe coincidir con productId del cliente
  // - product.documentId debe coincidir con documentId del cliente
  // - si viene size, debe existir en product.sizes
  const notFound = products.filter((p) => !p.product).map((p) => p.ci.documentId);
  const idMismatches = products
    .filter((p) => p.product && (p.product.id !== p.ci.productId || p.product.documentId !== p.ci.documentId))
    .map((p) => ({ expectedProductId: p.ci.productId, expectedDocumentId: p.ci.documentId, gotProductId: p.product!.id, gotDocumentId: p.product!.documentId }));

  const sizeMismatches = products
    .filter((p) => p.product && p.ci.size !== null)
    .filter((p) => !p.product!.sizes?.some((s) => s.size === p.ci.size))
    .map((p) => ({ documentId: p.ci.documentId, size: p.ci.size }));

  // si alguna validación falla, logueamos y abortamos
  if (notFound.length || idMismatches.length || sizeMismatches.length) {
    console.warn(
      JSON.stringify(
        {
          source: 'checkout-server',
          message: 'Cart validation failed',
          notFoundDocumentIds: notFound.length ? notFound : undefined,
          idMismatches: idMismatches.length ? idMismatches : undefined,
          sizeMismatches: sizeMismatches.length ? sizeMismatches : undefined,
        },
        null,
        2,
      ),
    );
    throw new Error('Cart validation failed');
  }

  // 3) construir items de Mercado Pago usando precios del servidor y campos sanitizados
  const mpItems = products
    .filter((p) => p.product)
    .map(({ ci, product }) => ({
      id: `${product!.documentId}${ci.size ? `-${ci.size}` : ''}`,
      title: `${product!.name}${ci.size ? ` - ${ci.size}` : ''}`,
      quantity: ci.quantity,
      unit_price: Number(product!.offer ? product!.offerPrice : product!.price),
      currency_id: 'ARS',
    }));

  if (mpItems.length === 0) {
    throw new Error('No valid products found to create preference');
  }

  // 4) log de auditoría para observabilidad (seguro para producción)
  try {
    const total = mpItems.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);
    console.log(
      JSON.stringify(
        {
          source: 'checkout-server',
          message: 'Verified cart items against Strapi, using authoritative prices',
          items: mpItems.map((it) => ({ id: it.id, title: it.title, quantity: it.quantity, unit_price: it.unit_price, currency_id: it.currency_id })),
          total,
          currency: 'ARS',
          notFoundDocumentIds: notFound.length ? notFound : undefined,
        },
        null,
        2,
      ),
    );
  } catch {}

  // 5) armar una base URL absoluta desde los headers de la request
  //    fallback a NEXT_PUBLIC_SITE_URL, VERCEL_URL o localhost en desarrollo
  let baseUrl: string | null = null;
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    if (host) baseUrl = `${proto}://${host}`;
  } catch {}
  if (!baseUrl) {
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  }

  // 6) crear la preference usando la ruta interna
  const res = await fetch(`${baseUrl}/api/payments/mp/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: mpItems }),
    // Avoid caching on server
    cache: 'no-store',
  });

  if (!res.ok) {
    // intentar extraer detalles de error para debug
    let details: unknown = null;
    try {
      details = await res.json();
    } catch {
      try {
        details = await res.text();
      } catch {}
    }
    throw new Error(`Failed to create preference: ${res.status} ${details ? JSON.stringify(details) : ''}`);
  }

  // 7) devolver el preferenceId al cliente
  const data = (await res.json()) as PreferenceResponse;
  return data;
}


