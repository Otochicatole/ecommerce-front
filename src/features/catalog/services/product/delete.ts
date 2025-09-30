'use server';

import axios from 'axios';
import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';
import { resolveNumericIdByDocumentId } from '@/features/catalog/services/resolve-by-document-id';


async function deleteProductWithFallback(idOrDocumentId: string, apiToken: string) {
  try {
    const { data } = await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(idOrDocumentId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return data;
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId('products', idOrDocumentId);
    const { data } = await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(numericId)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    });
    return data;
  }
}

export async function deleteProduct(formData: FormData) {
  const idOrDocumentId = String(formData.get('id') ?? '');
  if (!idOrDocumentId) throw new Error('Missing product id');
  const apiToken = getApiTokenOrThrow();
  return deleteProductWithFallback(idOrDocumentId, apiToken);
}


