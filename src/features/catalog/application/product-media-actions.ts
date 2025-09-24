'use server';

import axios from 'axios';
import env from '@/config';

function getApiTokenOrThrow(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API');
  return token;
}

/**
 * Sube una o varias imágenes al Media Library de Strapi mediante /api/upload
 * Espera en el FormData uno o más entries con key 'files'.
 * Devuelve los ids numéricos de los assets creados.
 */
export async function uploadProductMedia(formData: FormData): Promise<{ ids: number[]; raw: unknown }>{
  const apiToken = getApiTokenOrThrow();
  const multipart = new FormData();

  // Copiamos sólo files -> 'files'
  formData.forEach((value, key) => {
    if (key === 'files' && value instanceof File) {
      multipart.append('files', value);
    }
  });

  const { data } = await axios.request({
    method: 'POST',
    url: `${env.strapiUrl}/api/upload`,
    headers: { Authorization: `Bearer ${apiToken}` },
    data: multipart,
  });

  type UploadItem = { id?: number; data?: { id?: number } };
  const items: UploadItem[] = Array.isArray(data)
    ? (data as UploadItem[])
    : Array.isArray((data as { data?: UploadItem[] })?.data)
      ? ((data as { data?: UploadItem[] }).data as UploadItem[])
      : [];
  const ids: number[] = items
    .map((it) => it?.id ?? it?.data?.id)
    .filter((n): n is number => Number.isFinite(n as number));
  return { ids, raw: data };
}

/**
 * Setea la relación media del producto. No sube archivos.
 * Espera FormData con:
 * - id (documentId o numérico)
 * - media[0], media[1], ... como ids numéricos
 */
export async function setProductMedia(formData: FormData) {
  const apiToken = getApiTokenOrThrow();
  const idOrDoc = String(formData.get('id') ?? '');
  if (!idOrDoc) throw new Error('Missing product id');

  const ids: number[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('media[')) {
      const n = Number(value);
      if (Number.isFinite(n)) ids.push(n);
    }
  });

  const payload = { data: { media: ids } };

  // Intento directo; si 404, resuelvo id numérico con Content API
  try {
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(idOrDoc)}`,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: payload,
    });
    return data;
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
    const list = await axios.get(`${env.strapiUrl}/api/products`, { params: { 'filters[documentId][$eq]': idOrDoc } });
    const entry = Array.isArray(list.data?.data) ? list.data.data[0] : undefined;
    const numericId = entry?.id ?? entry?.attributes?.id;
    if (!numericId) throw new Error('Product not found');

    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${numericId}`,
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
 * Elimina archivos de la Media Library (Upload plugin) por id.
 * Espera FormData con keys: mediaRemove[0] = id, mediaRemove[1] = id, ...
 */
export async function deleteProductMedia(formData: FormData) {
  const apiToken = getApiTokenOrThrow();
  const ids: number[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('mediaRemove[')) {
      const n = Number(value);
      if (Number.isFinite(n)) ids.push(n);
    }
  });
  for (const id of ids) {
    await axios.request({
      method: 'DELETE',
      url: `${env.strapiUrl}/api/upload/files/${id}`,
      headers: { Authorization: `Bearer ${apiToken}` },
    });
  }
  return { deleted: ids.length };
}


