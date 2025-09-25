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

import env from '@/config';
import { getApiTokenOrThrow } from '@/features/catalog/services/get-api-token';
import { buildFriendlyUploadError } from './media.errors';
import { validateUploadFormData, requireProductId, extractNumericIds, isNotFoundAxiosError } from './media.validation';
import { httpUploadFiles, httpPutProductMedia, httpFindProductByDocumentId, httpDeleteAsset } from './media.http';

 

export async function uploadProductMedia(formData: FormData): Promise<{ ids: number[]; raw: unknown }>{
  const apiToken = getApiTokenOrThrow();
  try {
    const files = validateUploadFormData(formData);
    const data = await httpUploadFiles(env.strapiUrl, files, { token: apiToken });
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
    throw buildFriendlyUploadError(err);
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
  const idOrDoc = requireProductId(formData);
  const ids = extractNumericIds(formData, 'media[');
  try {
    const data = await httpPutProductMedia(env.strapiUrl, idOrDoc, ids, { token: apiToken });
    return data;
  } catch (error) {
    if (!isNotFoundAxiosError(error)) throw error;
    const list = await httpFindProductByDocumentId(env.strapiUrl, idOrDoc);
    const entry = Array.isArray(list?.data) ? list.data[0] : undefined;
    const numericId = entry?.id ?? entry?.attributes?.id;
    if (!numericId) throw new Error('Product not found');
    const data = await httpPutProductMedia(env.strapiUrl, numericId, ids, { token: apiToken });
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
  const ids = extractNumericIds(formData, 'mediaRemove[');
  for (const id of ids) {
    await httpDeleteAsset(env.strapiUrl, id, { token: apiToken });
  }
  return { deleted: ids.length };
}


