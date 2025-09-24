'use server';

import axios from 'axios';
import env from '@/config';

/**
 * Server Actions para CRUD de "Size" en Strapi usando la Content API.
 *
 * Notas:
 * - Requiere STRAPI_API_TOKEN con permisos sobre el tipo de contenido Size.
 * - Soporta id numérico (v4) y documentId (v5). En update/delete intenta primero
 *   con el valor recibido y, si Strapi responde 404 y no es numérico, resuelve
 *   el id numérico con un GET y reintenta.
 */

type SizeCreateInput = {
  size: string;
};

type SizeUpdateInput = {
  idOrDocumentId: string;
  size: string;
};

function getApiTokenOrThrow(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API');
  return token;
}

async function resolveNumericIdByDocumentId(documentId: string): Promise<string> {
  const { data } = await axios.get(`${env.strapiUrl}/api/sizes`, {
    params: { 'filters[documentId][$eq]': documentId },
    headers: { Accept: 'application/json' },
  });
  const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
  const resolvedId = entry?.id ?? entry?.attributes?.id;
  if (!resolvedId) throw new Error('Size not found');
  return String(resolvedId);
}

/**
 * Obtiene el listado de Sizes (paginado). Usa token si está disponible, pero no es obligatorio.
 */
export async function getSizes({ page = 1, pageSize = 100 }: { page?: number; pageSize?: number } = {}) {
  const params: Record<string, string> = {
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
  };
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.STRAPI_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  }

  const { data } = await axios.get(`${env.strapiUrl}/api/sizes`, { params, headers });
  return data;
}

/**
 * Obtiene un Size por id numérico o documentId (con fallback a resolución de id).
 */
export async function getSize(idOrDocumentId: string) {
  if (!idOrDocumentId) throw new Error('Missing size id');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.STRAPI_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  }

  // Intento directo primero
  try {
    const { data } = await axios.get(`${env.strapiUrl}/api/sizes/${encodeURIComponent(idOrDocumentId)}`, { headers });
    return data;
  } catch (error) {
    const is404 = axios.isAxiosError(error) && error.response?.status === 404;
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (!is404 || isNumeric) throw error;

    const numericId = await resolveNumericIdByDocumentId(idOrDocumentId);
    const { data } = await axios.get(`${env.strapiUrl}/api/sizes/${encodeURIComponent(numericId)}`, { headers });
    return data;
  }
}

/**
 * Crea un Size.
 */
export async function createSize(input: SizeCreateInput): Promise<unknown> {
  const apiToken = getApiTokenOrThrow();
  const payload = { data: { size: input.size } };

  const { data } = await axios.request({
    method: 'POST',
    url: `${env.strapiUrl}/api/sizes`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data: payload,
  });
  return data;
}

/**
 * Actualiza un Size por id numérico o documentId.
 */
export async function updateSize(input: SizeUpdateInput): Promise<unknown> {
  const apiToken = getApiTokenOrThrow();
  const payload = { data: { size: input.size } };

  // Intento directo (documentId soportado en v5)
  try {
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/sizes/${encodeURIComponent(input.idOrDocumentId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return data;
  } catch (error) {
    // Si es 404 y el id no es numérico, resolvemos y reintentamos
    const is404 = axios.isAxiosError(error) && error.response?.status === 404;
    const isNumeric = /^\d+$/.test(input.idOrDocumentId);
    if (!is404 || isNumeric) throw error;

    const numericId = await resolveNumericIdByDocumentId(input.idOrDocumentId);
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/sizes/${encodeURIComponent(numericId)}`,
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

/**
 * Elimina un Size por id numérico o documentId.
 */
export async function deleteSize(idOrDocumentId: string): Promise<unknown> {
  const apiToken = getApiTokenOrThrow();

  // Intento directo (documentId soportado en v5)
  try {
    const { data } = await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/sizes/${encodeURIComponent(idOrDocumentId)}`,
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
      url: `${env.strapiUrl}/api/sizes/${encodeURIComponent(numericId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return data;
  }
}


