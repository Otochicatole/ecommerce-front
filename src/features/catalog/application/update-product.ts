'use server';
import axios from 'axios';
import env from '@/config';

/**
 * Server Action para actualizar un producto en Strapi usando la Content API.
 *
 * Diseño y decisiones:
 * - Se exige el uso de STRAPI_API_TOKEN (token de API de Strapi) porque la Content API
 *   no acepta el token del panel de administración.
 * - Soporta ambas variantes de identificación del recurso:
 *   - Strapi v5: permite PUT directo con documentId en la ruta
 *   - Strapi v4: requiere id numérico; si llega un documentId se resuelve primero el id
 * - El payload se arma a partir de FormData, convirtiendo tipos (number/boolean) y
 *   transformando la descripción a Blocks (formato de Strapi).
 * - Errores: se devuelven como throw para que Next.js propague 500 y puedas manejar UI.
 */

type UpdatePayload = {
  data: {
    name?: string;
    price?: number;
    offer?: boolean;
    offerPrice?: number;
    stock?: number;
    show?: boolean;
    description: Array<{ type: 'paragraph'; children: Array<{ type: 'text'; text: string }> }>;
  };
};

/**
 * Convierte texto plano en el formato Blocks de Strapi.
 * Cada línea del texto se vuelve un párrafo con un único nodo de texto.
 */
function plainTextToBlocks(text: string): Array<{ type: 'paragraph'; children: Array<{ type: 'text'; text: string }> }> {
  const lines = text.split(/\r?\n/);
  return lines.map((line) => ({ type: 'paragraph' as const, children: [{ type: 'text' as const, text: line }] }));
}

/**
 * Construye el payload de actualización a partir del FormData del formulario de edición.
 * - Castea números (price, offerPrice, stock)
 * - Castea booleanos (offer, show)
 * - Convierte la descripción a Blocks
 * - Sólo incluye campos presentes para evitar sobreescrituras innecesarias
 */
function buildUpdatePayload(formData: FormData): UpdatePayload {
  const name = formData.get('name')?.toString();
  const priceStr = formData.get('price')?.toString();
  const offerStr = formData.get('offer')?.toString();
  const offerPriceStr = formData.get('offerPrice')?.toString();
  const stockStr = formData.get('stock')?.toString();
  const showStr = formData.get('show')?.toString();
  const descriptionText = formData.get('descriptionText')?.toString() ?? '';

  return {
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(priceStr !== undefined ? { price: Number(priceStr) } : {}),
      ...(offerStr !== undefined ? { offer: offerStr === 'true' } : {}),
      ...(offerPriceStr !== undefined && offerStr === 'true' ? { offerPrice: Number(offerPriceStr) } : {}),
      ...(stockStr !== undefined ? { stock: Number(stockStr) } : {}),
      ...(showStr !== undefined ? { show: showStr === 'true' } : {}),
      description: plainTextToBlocks(descriptionText),
    },
  };
}

/**
 * Obtiene el token de API de Strapi desde variables de entorno.
 * Lanza un error claro si no está definido para que el flujo falle rápido.
 */
function getApiTokenOrThrow(): string {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API update');
  return token;
}

/**
 * Resuelve el id numérico de un producto partiendo de su documentId utilizando
 * la Content API pública (sólo lectura). Útil para compatibilidad con Strapi v4.
 */
async function resolveNumericIdByDocumentId(documentId: string): Promise<string> {
  const { data } = await axios.get(`${env.strapiUrl}/api/products`, {
    params: { 'filters[documentId][$eq]': documentId },
    headers: { Accept: 'application/json' },
  });
  const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
  const resolvedId = entry?.id ?? entry?.attributes?.id;
  if (!resolvedId) throw new Error('Product not found');
  return String(resolvedId);
}

/**
 * Intenta actualizar usando el id dado. Si Strapi responde 404 y el id no es numérico,
 * asume que era un documentId, resuelve el id numérico y reintenta.
 */
async function putProductWithFallback(idOrDocumentId: string, payload: UpdatePayload, apiToken: string) {
  try {
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(idOrDocumentId)}`,
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
    const isNumeric = /^\d+$/.test(idOrDocumentId);
    if (isNumeric) throw error;
    const numericId = await resolveNumericIdByDocumentId(idOrDocumentId);
    const { data } = await axios.request({
      method: 'PUT',
      url: `${env.strapiUrl}/api/products/${encodeURIComponent(numericId)}`,
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
 * Punto de entrada de la Server Action.
 *
 * Espera en FormData:
 * - id: string (documentId o id numérico)
 * - name, price, offer, offerPrice, stock, show, descriptionText
 *
 * Devuelve la respuesta cruda de Strapi (JSON del entry actualizado).
 */
export async function updateProduct(formData: FormData) {
  const idOrDocumentId = String(formData.get('id') ?? '');
  if (!idOrDocumentId) throw new Error('Missing product id');
  const payload = buildUpdatePayload(formData);
  const apiToken = getApiTokenOrThrow();
  return putProductWithFallback(idOrDocumentId, payload, apiToken);
}


