'use server';

// Capa de servicios: Producto (mutaciones)
//
// Responsabilidad: actualizar un producto en Strapi a partir de un FormData
// proveniente del formulario de administración.
//
// Decisiones de diseño:
// - Se exige STRAPI_API_TOKEN (Content API) para escritura segura.
// - Soporta id numérico y documentId: si falla con 404 y no es numérico,
//   resuelve id y reintenta (compatibilidad v4/v5).
// - Convierte la descripción de texto plano a Blocks (formato Strapi).
// - Convierte relaciones (sizes, type_products) a ids numéricos, resolviendo
//   documentId cuando es necesario.

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';
import { resolveNumericIdByDocumentId } from '@/features/catalog/services/resolve-by-document-id';
import { plainTextToBlocks } from '@/features/catalog/services/product/description';

type UpdatePayload = {
  data: {
    name?: string;
    price?: number;
    offer?: boolean;
    offerPrice?: number;
    stock?: number;
    show?: boolean;
    description: Array<{ type: 'paragraph'; children: Array<{ type: 'text'; text: string }> }>;
    sizes?: number[];
    type_products?: number[];
    media?: number[];
  };
};

// Construye payload de actualización desde el FormData del formulario
function buildUpdatePayload(formData: FormData): UpdatePayload {
  const name = formData.get('name')?.toString();
  const priceStr = formData.get('price')?.toString();
  const offerStr = formData.get('offer')?.toString();
  const offerPriceStr = formData.get('offerPrice')?.toString();
  const stockStr = formData.get('stock')?.toString();
  const showStr = formData.get('show')?.toString();
  const descriptionText = formData.get('descriptionText')?.toString() ?? '';

  return {
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(priceStr !== undefined ? { price: Number(priceStr) } : {}),
      ...(offerStr !== undefined ? { offer: offerStr === 'true' } : {}),
      ...(offerPriceStr !== undefined && offerStr === 'true' ? { offerPrice: Number(offerPriceStr) } : {}),
      ...(stockStr !== undefined ? { stock: Number(stockStr) } : {}),
      ...(showStr !== undefined ? { show: showStr === 'true' } : {}),
      description: plainTextToBlocks(descriptionText),
    },
  };
}


// Resuelve id numérico partiendo de documentId para compatibilidad
// uses shared resolver from services

// Extrae múltiples valores de FormData con prefijo (sizes[0], sizes[1], ...)
function collectRelationIds(formData: FormData, prefix: string): string[] {
  const values: string[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith(`${prefix}[`)) values.push(String(value));
  });
  return values;
}

// Normaliza ids de relaciones: acepta numéricos y documentId
async function resolveRelationIds(ids: string[], resource: 'sizes' | 'type-products'): Promise<number[]> {
  const results: number[] = [];
  for (const id of ids) {
    if (/^\d+$/.test(id)) {
      results.push(Number(id));
      continue;
    }
    // Resolver id numérico consultando por documentId con filtro (evita problemas de paginación)
    const { data } = await axios.get(`${env.strapiUrl}/api/${resource}`, {
      params: { 'filters[documentId][$eq]': id },
      headers: { Accept: 'application/json' },
    });
    const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
    const numeric = entry?.id ?? entry?.attributes?.id;
    if (numeric === undefined) continue;
    results.push(Number(numeric));
  }
  return results;
}

// PUT con fallback: intenta con el id recibido, si 404 y es documentId, reintenta
async function putProductWithFallback(idOrDocumentId: string, payload: UpdatePayload, apiToken: string) {
  try {
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(idOrDocumentId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return data;
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId('products', idOrDocumentId);
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(numericId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return data;
  }
}

// Punto de entrada de actualización desde el formulario de admin
export async function updateProduct(formData: FormData) {
  const idOrDocumentId = String(formData.get('id') ?? '');
  if (!idOrDocumentId) throw new Error('Missing product id');
  const payload = buildUpdatePayload(formData);
  const keepIdsStr = collectRelationIds(formData, 'mediaKeep');
  const keepIds = keepIdsStr.map(Number).filter((n) => Number.isFinite(n));
  const rawSizes = collectRelationIds(formData, 'sizes');
  const rawTypes = collectRelationIds(formData, 'type_products');
  const [sizeIds, typeIds] = await Promise.all([
    resolveRelationIds(rawSizes, 'sizes'),
    resolveRelationIds(rawTypes, 'type-products'),
  ]);
  if (sizeIds.length) payload.data.sizes = sizeIds;
  if (typeIds.length) payload.data.type_products = typeIds;
  const apiToken = getApiTokenOrThrow();
  if (keepIds.length) payload.data.media = keepIds;
  return putProductWithFallback(idOrDocumentId, payload, apiToken);
}


