'use server';

// Capa de servicios: Size (lecturas)
//
// Provee listados y lectura individual por id o documentId, con fallback.

import axios from 'axios';
import env from '@/config';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.STRAPI_API_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
  return headers;
}

// Lista paginada de sizes
export async function getSizes({ page = 1, pageSize = 100 }: { page?: number; pageSize?: number } = {}) {
  const params: Record<string, string> = {
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
  };
  const { data } = await axios.get(`${env.strapiUrl}/api/sizes`, { params, headers: getAuthHeaders() });
  return data;
}

// Obtiene un size por id o documentId con fallback
export async function getSize(idOrDocumentId: string) {
  if (!idOrDocumentId) throw new Error('Missing size id');
  try {
    const { data } = await axios.get(`${env.strapiUrl}/api/sizes/${encodeURIComponent(idOrDocumentId)}`, {
      headers: getAuthHeaders(),
    });
    return data;
  } catch (error) {
    const isAxios404 = (e: unknown) => (axios.isAxiosError(e) && e.response?.status === 404);
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (!isAxios404(error) || isNumeric) throw error;

    const { data } = await axios.get(`${env.strapiUrl}/api/sizes`, {
      params: { 'filters[documentId][$eq]': idOrDocumentId },
      headers: getAuthHeaders(),
    });
    const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
    const numericId = entry?.id ?? entry?.attributes?.id;
    if (!numericId) throw error;
    const byId = await axios.get(`${env.strapiUrl}/api/sizes/${encodeURIComponent(String(numericId))}`, {
      headers: getAuthHeaders(),
    });
    return byId.data;
  }
}


