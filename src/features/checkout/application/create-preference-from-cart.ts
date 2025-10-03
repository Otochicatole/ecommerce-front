'use server';

// server action para crear una preference de Mercado Pago a partir del carrito del cliente.
// responsabilidades:
// - recibir items del carrito desde el cliente (documentId, productId, size, quantity)
// - recibir datos personales del cliente (nombre, apellido, dni)
// - consultar a strapi por documentId para obtener datos autoritativos del producto
// - validar identidad del producto (id/documentId) y disponibilidad del talle
// - crear orden en Strapi con identificador único
// - construir los items de Mercado Pago usando precios verificados del lado servidor
// - incluir información del payer (dni, nombre) en la preference
// - loguear la verificación para auditoría
// - llamar a la ruta interna que crea la preference y devolver el preferenceId

import { fetchProductByDocumentId } from '@ecommerce-front/features/catalog/services/product/get';
import { headers } from 'next/headers';
import { createOrder, type OrderItem } from '@/features/checkout/services/order.http';
import { generateOrderId } from '@/features/checkout/services/order.utils';

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

// datos personales del cliente para la orden
type CustomerData = {
  name: string;
  lastName: string;
  dni: string;
  email: string;
};

// respuesta mínima que devuelve la ruta interna de preference
type PreferenceResponse = {
  preferenceId: string;
  orderId: string;
};

// crea una orden en Strapi y una preference de Mercado Pago a partir de items validados del carrito.
// lanza error si el carrito está vacío, si falla alguna validación, si falta información del cliente
// o si la API interna de preference responde con error.
export async function createPreferenceFromCart(
  cartItems: CartInputItem[],
  customerData: CustomerData
): Promise<PreferenceResponse> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // validate customer data
  if (!customerData.name?.trim() || !customerData.lastName?.trim() || !customerData.dni?.trim() || !customerData.email?.trim()) {
    throw new Error('Customer data is incomplete');
  }

  const dniNumber = Number(customerData.dni);
  if (!Number.isInteger(dniNumber) || dniNumber <= 0) {
    throw new Error('DNI must be a valid positive number');
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

  // 3.1) calculate total
  const total = mpItems.reduce((acc, it) => acc + it.unit_price * it.quantity, 0);

  // 3.2) create order items for Strapi
  const orderItems: OrderItem[] = products
    .filter((p) => p.product)
    .map(({ ci, product }) => ({
      productId: product!.id,
      documentId: product!.documentId,
      name: product!.name,
      price: Number(product!.offer ? product!.offerPrice : product!.price),
      quantity: ci.quantity,
      size: ci.size,
    }));

  // 3.3) generate unique order identifier
  const orderId = generateOrderId();

  // 3.4) create order in Strapi
  try {
    await createOrder({
      name: customerData.name.trim(),
      lastName: customerData.lastName.trim(),
      dni: dniNumber,
      products: orderItems,
      total,
      order: orderId,
      orderPayment: false, // will be updated by webhook when payment is confirmed
    });
  } catch (error) {
    console.error('Failed to create order in Strapi', error);
    throw new Error('Failed to create order');
  }

  // 4) log de auditoría para observabilidad (seguro para producción)
  try {
    console.log(
      JSON.stringify(
        {
          source: 'checkout-server',
          message: 'Created order and verified cart items against Strapi',
          orderId,
          customer: { name: customerData.name, lastName: customerData.lastName, dni: dniNumber },
          items: mpItems.map((it) => ({ id: it.id, title: it.title, quantity: it.quantity, unit_price: it.unit_price, currency_id: it.currency_id })),
          total,
          currency: 'ARS',
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

  // 6) crear la preference usando la ruta interna, incluyendo datos del payer
  const res = await fetch(`${baseUrl}/api/payments/mp/preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: mpItems,
      payer: {
        name: customerData.name.trim(),
        surname: customerData.lastName.trim(),
        email: customerData.email.trim(),
        identification: {
          type: 'DNI',
          number: String(dniNumber),
        },
      },
      externalReference: orderId,
    }),
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

  // 7) devolver el preferenceId y orderId al cliente
  const data = (await res.json()) as PreferenceResponse;
  return { ...data, orderId };
}


