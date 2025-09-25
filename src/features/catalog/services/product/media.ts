'use server';

/*
  Servicios de Media de Producto (Strapi Upload)

  Objetivo del módulo:
  - Subir imágenes al plugin Upload de Strapi
  - Asociar/desasociar media a un producto
  - Eliminar assets del Media Library

  Reglas de negocio y decisiones:
  - Sólo se aceptan archivos de tipo imagen (image/*)
  - Límite por archivo ~0.95 MB para convivir con límites por defecto de Server Actions
  - Las subidas se realizan idealmente de a una imagen por request desde el cliente
  - Los errores se devuelven con mensajes descriptivos y posibles causas
*/

import axios from 'axios';
import env from '@/config';

function getApiTokenOrThrow(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API');
  return token;
}

export async function uploadProductMedia(formData: FormData): Promise<{ ids: number[]; raw: unknown }>{
  const apiToken = getApiTokenOrThrow();
  const MAX_FILE_BYTES = Math.floor(0.95 * 1024 * 1024); // ~0.95MB per file on server action
  formData.forEach((value, key) => {
    if (key === 'files' && value instanceof File) {
      if (!(value.type && value.type.startsWith('image/'))) {
        throw new Error(`solo se permiten imágenes. archivo inválido: ${value.name}`);
      }
      if (value.size > MAX_FILE_BYTES) {
        throw new Error(`file ${value.name} exceeds 1MB limit`);
      }
    }
  });
  const multipart = new FormData();
  formData.forEach((value, key) => {
    if (key === 'files' && value instanceof File) {
      multipart.append('files', value);
    }
  });
  try {
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
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const resData: unknown = err.response?.data;
      let serverMessage = '';
      if (typeof resData === 'string') {
        serverMessage = resData;
      } else if (resData && typeof resData === 'object') {
        const obj = resData as Record<string, unknown>;
        const errorObj = (obj['error'] ?? {}) as Record<string, unknown>;
        serverMessage = String(errorObj['message'] ?? obj['message'] ?? err.message ?? '');
      } else {
        serverMessage = err.message;
      }
      const reasons: string[] = [];
      // Always include size guidance since we enforce 0.95MB
      reasons.push('el archivo supera 1MB o no pudo comprimirse por debajo de 1MB');
      // Heuristics by common failure categories
      const textBlob = JSON.stringify(resData || {}).toLowerCase() + ' ' + (serverMessage || '').toLowerCase();
      if (textBlob.includes('token') || textBlob.includes('unauthorized') || textBlob.includes('forbidden')) {
        reasons.push('token de API inválido o sin permisos en Strapi');
      }
      if (textBlob.includes('body exceeded') || textBlob.includes('payload') || textBlob.includes('entity too large')) {
        reasons.push('límite de tamaño del request en el servidor; reiniciar o subir bodySizeLimit');
      }
      if (textBlob.includes('mime') || textBlob.includes('file type') || textBlob.includes('unsupported')) {
        reasons.push('formato de imagen no soportado por el plugin de upload');
      }
      if (textBlob.includes('network') || err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
        reasons.push('problema de red al contactar Strapi');
      }
      if (reasons.length < 2) {
        reasons.push('error interno del servidor de archivos');
      }
      const friendly = `no se pudo subir la imagen. posibles causas: ${reasons.join('; ')}${serverMessage ? `. detalle: ${serverMessage}` : ''}`;
      throw new Error(friendly);
    }
    throw new Error('no se pudo subir la imagen por un error inesperado en el servidor');
  }
}

/**
 * Asocia un conjunto de ids de media al producto indicado.
 *
 * Expectativas de entrada (FormData):
 * - id: string (documentId o id numérico del producto)
 * - media[0], media[1], ...: ids numéricos de assets existentes en Upload
 *
 * Comportamiento:
 * - Intenta PUT directo con el id recibido
 * - Si Strapi responde 404 y el id no es numérico, resuelve el id numérico por documentId y reintenta
 * - Devuelve la respuesta cruda de Strapi
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
    // Fallback: si recibimos documentId, buscamos el id numérico y reintentamos
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
 * Elimina assets del Media Library por id numérico.
 *
 * Expectativas de entrada (FormData):
 * - mediaRemove[0] = id, mediaRemove[1] = id, ...
 *
 * Comportamiento:
 * - Itera los ids y ejecuta DELETE por cada asset
 * - Devuelve un resumen con la cantidad borrada
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


