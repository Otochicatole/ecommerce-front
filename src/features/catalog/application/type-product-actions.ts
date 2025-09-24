'use server';

import axios from 'axios';
import env from '@/config';

/**
 * Server Actions para CRUD y lectura de TypeProduct usando la Content API de Strapi.
 * Requiere STRAPI_API_TOKEN para operaciones de escritura.
 */

type TypeProductCreateInput = { type: string };
type TypeProductUpdateInput = { idOrDocumentId: string; type: string };

function getApiTokenOrThrow(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API');
  return token;
}

async function resolveNumericIdByDocumentId(documentId: string): Promise<string> {
  const { data } = await axios.get(`${env.strapiUrl}/api/type-products`, {
    params: { 'filters[documentId][$eq]': documentId },
    headers: { Accept: 'application/json' },
  });
  const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
  const resolvedId = entry?.id ?? entry?.attributes?.id;
  if (!resolvedId) throw new Error('TypeProduct not found');
  return String(resolvedId);
}

// CREATE
export async function createTypeProduct(input: TypeProductCreateInput) {
  const apiToken = getApiTokenOrThrow();
  const payload = { data: { type: input.type } };
  const { data } = await axios.request({
    method: 'POST',
    url: `${env.strapiUrl}/api/type-products`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: payload,
  });
  return data;
}

// UPDATE (id o documentId)
export async function updateTypeProduct(input: TypeProductUpdateInput) {
  const apiToken = getApiTokenOrThrow();
  const payload = { data: { type: input.type } };
  try {
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/type-products/${encodeURIComponent(input.idOrDocumentId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return data;
  } catch (error) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404;
    const isNumeric = /^\d+$/.test(input.idOrDocumentId);
    if (!is404 || isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId(input.idOrDocumentId);
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/type-products/${encodeURIComponent(numericId)}`,
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

// DELETE (id o documentId)
export async function deleteTypeProduct(idOrDocumentId: string) {
  const apiToken = getApiTokenOrThrow();
  try {
    const { data } = await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/type-products/${encodeURIComponent(idOrDocumentId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return data;
  } catch (error) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404;
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (!is404 || isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId(idOrDocumentId);
    const { data } = await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/type-products/${encodeURIComponent(numericId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return data;
  }
}

// GET list (paginado)
export async function getTypeProducts({ page = 1, pageSize = 100 }: { page?: number; pageSize?: number } = {}) {
  const params: Record<string, string> = {
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
  };
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.STRAPI_API_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  const { data } = await axios.get(`${env.strapiUrl}/api/type-products`, { params, headers });
  return data;
}

// GET one (id o documentId)
export async function getTypeProduct(idOrDocumentId: string) {
  if (!idOrDocumentId) throw new Error('Missing type product id');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.STRAPI_API_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  try {
    const { data } = await axios.get(`${env.strapiUrl}/api/type-products/${encodeURIComponent(idOrDocumentId)}`, { headers });
    return data;
  } catch (error) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404;
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (!is404 || isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId(idOrDocumentId);
    const { data } = await axios.get(`${env.strapiUrl}/api/type-products/${encodeURIComponent(numericId)}`, { headers });
    return data;
  }
}


