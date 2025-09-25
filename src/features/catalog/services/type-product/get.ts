'use server';

// Capa de servicios: Type-Product (lecturas)
//
// Provee listados y lectura individual por id o documentId, con fallback.
// Incluye un wrapper compat para `fetchAllCategories` usado en la navbar.

import axios from 'axios';
import env from '@/config';
import { ApiResponseAllCategories } from '@/types/api/category-response';
import { getAuthHeaders } from '@/features/catalog/services/get-auth-headers';

// Lista paginada de type-products
export async function getTypeProducts({ page = 1, pageSize = 100 }: { page?: number; pageSize?: number } = {}) {
  const params: Record<string, string> = {
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
  };
  const { data } = await axios.get(`${env.strapiUrl}/api/type-products`, { params, headers: getAuthHeaders() });
  return data;
}

// Obtiene un type-product por id o documentId con fallback
export async function getTypeProduct(idOrDocumentId: string) {
  if (!idOrDocumentId) throw new Error('Missing type product id');
  try {
    const { data } = await axios.get(`${env.strapiUrl}/api/type-products/${encodeURIComponent(idOrDocumentId)}`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    const isAxios404 = (e: unknown) => (axios.isAxiosError(e) && e.response?.status === 404);
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (!isAxios404(error) || isNumeric) throw error;
    const { data } = await axios.get(`${env.strapiUrl}/api/type-products`, {
      params: { 'filters[documentId][$eq]': idOrDocumentId },
      headers: getAuthHeaders(),
    });
    const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
    const numericId = entry?.id ?? entry?.attributes?.id;
    if (!numericId) throw error;
    const byId = await axios.get(`${env.strapiUrl}/api/type-products/${encodeURIComponent(String(numericId))}`, {
      headers: getAuthHeaders(),
    });
    return byId.data;
  }
}

// Backward-compatible wrapper used by nav bar
export async function fetchAllCategories(): Promise<ApiResponseAllCategories> {
  const { data } = await axios.get(`${env.strapiUrl}/api/type-products`, { params: { populate: '*' }, headers: getAuthHeaders() });
  return data as ApiResponseAllCategories;
}


