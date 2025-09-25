'use server';

// Capa de servicios: Size (mutaciones)
//
// Expone create, update y delete con compatibilidad id/documentId.
// Requiere STRAPI_API_TOKEN para operaciones de escritura.

import axios from 'axios';
import env from '@/config';

type SizeCreateInput = { size: string };
type SizeUpdateInput = { idOrDocumentId: string; size: string };

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

export async function createSize(input: SizeCreateInput) {
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

export async function updateSize(input: SizeUpdateInput) {
  const apiToken = getApiTokenOrThrow();
  const payload = { data: { size: input.size } };

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

export async function deleteSize(idOrDocumentId: string) {
  const apiToken = getApiTokenOrThrow();

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


