import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';

export type SaleFlat = { id: number; name: string; salePrice: number; saleDate: string };

export type SaleRecordInput = {
  name: string;
  salePrice: number;
  saleDate: string; // ISO string
  publishedAt?: string; // optional publish timestamp if D&P enabled
};

export async function createSaleRecord(input: SaleRecordInput) {
  const token = getApiTokenOrThrow();
  const payload = { data: input };
  const { data } = await axios.request({
    method: 'POST',
    url: `${env.strapiUrl}/api/sales`,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: payload,
  });
  return data;
}

// Normalizes Strapi v4 (attributes) and v5 (flat) responses
export async function getSales(params?: { page?: number; pageSize?: number; q?: string; from?: string; to?: string }) {
  const token = getApiTokenOrThrow();
  const { page = 1, pageSize = 50, q, from, to } = params ?? {};

  function toStartOfDayIso(input: string): string {
    // Accept YYYY-MM-DD or full ISO; normalize to start of day UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      const iso = new Date(Date.UTC(y, (m - 1), d, 0, 0, 0, 0)).toISOString();
      return iso;
    }
    const dt = new Date(input);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0, 0)).toISOString();
  }

  function toEndOfDayIso(input: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      const iso = new Date(Date.UTC(y, (m - 1), d, 23, 59, 59, 999)).toISOString();
      return iso;
    }
    const dt = new Date(input);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999)).toISOString();
  }
  const { data } = await axios.request({
    method: 'GET',
    url: `${env.strapiUrl}/api/sales`,
    params: (() => {
      const base: Record<string, string> = {
        'pagination[page]': String(page),
        'pagination[pageSize]': String(pageSize),
        sort: 'saleDate:desc',
        publicationState: 'preview',
      };
      let idx = 0;
      if (q) { base[`filters[$and][${idx}][name][$containsi]`] = q; idx += 1; }
      if (from) { base[`filters[$and][${idx}][saleDate][$gte]`] = toStartOfDayIso(from); idx += 1; }
      if (to) { base[`filters[$and][${idx}][saleDate][$lte]`] = toEndOfDayIso(to); idx += 1; }
      return base;
    })(),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  type StrapiItemV4 = { id: number; attributes?: { name?: string; salePrice?: number | string; saleDate?: string } };
  type StrapiItemV5 = { id: number; name?: string; salePrice?: number | string; saleDate?: string };
  const raw: unknown = (data as unknown as { data?: unknown }).data;
  const items: Array<StrapiItemV4 | StrapiItemV5> = Array.isArray(raw) ? (raw as Array<StrapiItemV4 | StrapiItemV5>) : [];
  const mapped: SaleFlat[] = items.map((it) => {
    const src = (it as StrapiItemV4).attributes ?? (it as StrapiItemV5); // v4 vs v5
    return {
      id: it.id,
      name: String(src?.name ?? ''),
      salePrice: Number(src?.salePrice ?? 0),
      saleDate: String(src?.saleDate ?? ''),
    };
  });
  const meta = (data as unknown as { meta?: unknown }).meta;
  return { data: mapped, meta } as { data: SaleFlat[]; meta: unknown };
}

// Compute total salePrice across all pages for current filters
export async function getSalesTotalAmount(params?: { q?: string; from?: string; to?: string }) {
  const token = getApiTokenOrThrow();
  const { q, from, to } = params ?? {};

  function toStartOfDayIso(input: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      return new Date(Date.UTC(y, (m - 1), d, 0, 0, 0, 0)).toISOString();
    }
    const dt = new Date(input);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0, 0)).toISOString();
  }
  function toEndOfDayIso(input: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      return new Date(Date.UTC(y, (m - 1), d, 23, 59, 59, 999)).toISOString();
    }
    const dt = new Date(input);
    return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 23, 59, 59, 999)).toISOString();
  }

  function buildParams(p: number, ps: number): Record<string, string> {
    const base: Record<string, string> = {
      'pagination[page]': String(p),
      'pagination[pageSize]': String(ps),
      sort: 'saleDate:desc',
      publicationState: 'preview',
      'fields[0]': 'salePrice',
    };
    let idx = 0;
    if (q) { base[`filters[$and][${idx}][name][$containsi]`] = q; idx += 1; }
    if (from) { base[`filters[$and][${idx}][saleDate][$gte]`] = toStartOfDayIso(from); idx += 1; }
    if (to) { base[`filters[$and][${idx}][saleDate][$lte]`] = toEndOfDayIso(to); idx += 1; }
    return base;
  }

  let page = 1;
  const pageSize = 200;
  let pageCount = 1;
  let sum = 0;
  do {
    const { data } = await axios.request({
      method: 'GET',
      url: `${env.strapiUrl}/api/sales`,
      params: buildParams(page, pageSize),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    type StrapiItemV4 = { id: number; attributes?: { salePrice?: number | string } };
    type StrapiItemV5 = { id: number; salePrice?: number | string };
    const raw: unknown = (data as unknown as { data?: unknown }).data;
    const items: Array<StrapiItemV4 | StrapiItemV5> = Array.isArray(raw) ? (raw as Array<StrapiItemV4 | StrapiItemV5>) : [];
    for (const it of items) {
      const src = (it as StrapiItemV4).attributes ?? (it as StrapiItemV5);
      sum += Number(src?.salePrice ?? 0);
    }
    const meta = (data as unknown as { meta?: { pagination?: { pageCount?: number } } }).meta;
    pageCount = Math.max(1, Number(meta?.pagination?.pageCount || 1));
    page += 1;
  } while (page <= pageCount);
  return sum;
}


