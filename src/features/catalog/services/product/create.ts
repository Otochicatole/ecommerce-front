'use server';

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';

type CreatePayload = {
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
  };
};

function plainTextToBlocks(text: string): Array<{ type: 'paragraph'; children: Array<{ type: 'text'; text: string }> }> {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => ({ type: 'paragraph' as const, children: [{ type: 'text' as const, text: line }] }));
}

function buildCreatePayload(formData: FormData): CreatePayload {
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

async function resolveRelationIds(ids: string[], resource: 'sizes' | 'type-products'): Promise<number[]> {
  const results: number[] = [];
  for (const id of ids) {
    if (/^\d+$/.test(id)) {
      results.push(Number(id));
      continue;
    }
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

function collectRelationIds(formData: FormData, prefix: string): string[] {
  const values: string[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith(`${prefix}[`)) values.push(String(value));
  });
  return values;
}

export async function createProduct(formData: FormData) {
  const payload = buildCreatePayload(formData);
  const rawSizes = collectRelationIds(formData, 'sizes');
  const rawTypes = collectRelationIds(formData, 'type_products');
  const [sizeIds, typeIds] = await Promise.all([
    resolveRelationIds(rawSizes, 'sizes'),
    resolveRelationIds(rawTypes, 'type-products'),
  ]);
  if (sizeIds.length) payload.data.sizes = sizeIds;
  if (typeIds.length) payload.data.type_products = typeIds;

  const apiToken = getApiTokenOrThrow();
  const { data } = await axios.request({
    method: 'POST',
    url: `${env.strapiUrl}/api/products`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: payload,
  });
  const created = (data && (data.data ?? data)) as any;
  const id = created?.id ?? created?.attributes?.id;
  const documentId = created?.documentId ?? created?.attributes?.documentId ?? '';
  return { id, documentId } as { id?: number; documentId?: string };
}


