'use server';

// Capa de servicios: Type-Product (mutaciones)
//
// Expone create, update y delete con compatibilidad id/documentId.
// Requiere STRAPI_API_TOKEN ya que son operaciones de escritura.

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';

type TypeProductCreateInput = { type: string };
type TypeProductUpdateInput = { idOrDocumentId: string; type: string };


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


