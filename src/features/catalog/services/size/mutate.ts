'use server';

// Capa de servicios: Size (mutaciones)
//
// Expone create, update y delete con compatibilidad id/documentId.
// Requiere STRAPI_API_TOKEN para operaciones de escritura.

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';
import { resolveNumericIdByDocumentId } from '@/features/catalog/services/resolve-by-document-id';

type SizeCreateInput = { size: string };
type SizeUpdateInput = { idOrDocumentId: string; size: string };



export async function createSize(input: SizeCreateInput) {
  const apiToken = getApiTokenOrThrow();
  const raw = (input.size ?? '').trim();
  if (!raw) throw new Error('Size is required');
  // normalize: upper-case and strip non A-Z0-9 to match backend regex
  const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) throw new Error('Size is invalid after normalization');
  if (!/^[A-Z0-9]+$/.test(normalized)) throw new Error('Size format invalid');
  const payload = { data: { size: normalized } };

  try {
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
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const respData = error.response?.data as unknown as { error?: { message?: string } } | undefined;
      const msg = respData?.error?.message ?? error.message;
      throw new Error(msg);
    }
    throw error;
  }
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

    const numericId = await resolveNumericIdByDocumentId('sizes', input.idOrDocumentId);
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

    const numericId = await resolveNumericIdByDocumentId('sizes', idOrDocumentId);
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


