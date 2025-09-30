'use server';

// Capa de servicios: Type-Product (mutaciones)
//
// Expone create, update y delete con compatibilidad id/documentId.
// Requiere STRAPI_API_TOKEN ya que son operaciones de escritura.

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';
import { resolveNumericIdByDocumentId } from '@/features/catalog/services/resolve-by-document-id';

type TypeProductCreateInput = { type: string };
type TypeProductUpdateInput = { idOrDocumentId: string; type: string };



export async function createTypeProduct(input: TypeProductCreateInput) {
  const apiToken = getApiTokenOrThrow();
  const raw = (input.type ?? '').trim();
  if (!raw) throw new Error('Type is required');
  // normalize: lower-case, allow letters, numbers and spaces; collapse multiple spaces
  const normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error('Type is invalid after normalization');
  if (!/^[a-z0-9\s]+$/.test(normalized)) throw new Error('Type format invalid');
  const payload = { data: { type: normalized } };
  try {
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
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const respData = error.response?.data as unknown as { error?: { message?: string } } | undefined;
      const msg = respData?.error?.message ?? error.message;
      throw new Error(msg);
    }
    throw error;
  }
}

export async function updateTypeProduct(input: TypeProductUpdateInput) {
  const apiToken = getApiTokenOrThrow();
  const raw = (input.type ?? '').trim();
  if (!raw) throw new Error('Type is required');
  const normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) throw new Error('Type is invalid after normalization');
  if (!/^[a-z0-9\s]+$/.test(normalized)) throw new Error('Type format invalid');
  const payload = { data: { type: normalized } };
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
    const numericId = await resolveNumericIdByDocumentId('type-products', input.idOrDocumentId);
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
    const numericId = await resolveNumericIdByDocumentId('type-products', idOrDocumentId);
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


