// Capa de servicios: Producto (lecturas)
//
// Responsabilidad: acceder a la Content API de Strapi para obtener productos
// mediante filtros comunes (paginación, ofertas, categoría), obtener por id
// numérico y por documentId (v5), además de búsqueda por nombre.
//
// Notas de diseño:
// - Se usa un http client centralizado (config/http) con baseURL + headers.
// - Todas las lecturas incluyen populate=* para traer relaciones y media.
// - fetchProductByDocumentId devuelve el primer match del listado por documentId.
// - Esta capa no conoce de UI ni Server Actions; sólo HTTP puro.

import { ApiResponseAllProducts, ApiResponseProductById } from "@/types/api/product-response";
import http from "@/config/http";
import { mapProductsNumericFields, mapProductNumericFields } from "./normalize";

interface FetchProductsParams {
  page?: number;
  pageSize?: number;
  offer?: boolean;
  category?: string;
}

// Lista de productos con filtros comunes (paginación, oferta, categoría)
export async function fetchProducts({ page = 1, pageSize = 20, offer, category }: FetchProductsParams = {}): Promise<ApiResponseAllProducts> {
  const query = new URLSearchParams();
  query.append("pagination[page]", page.toString());
  query.append("pagination[pageSize]", pageSize.toString());
  query.append("populate", "*");
  if (offer) query.append("filters[offer][$eq]", "true");
  if (category) query.append("filters[type_products][type][$eq]", category);

  const url = `/api/products?${query.toString()}`;
  const { data } = await http.get<ApiResponseAllProducts>(url);
  return { ...data, data: mapProductsNumericFields(data.data) };
}

// Alias para traer un lote acotado de productos (útil para catálogos pequeños)
export async function fetchAllProducts(): Promise<ApiResponseAllProducts> {
  return fetchProducts({ page: 1, pageSize: 100 });
}

// Obtiene un producto por id numérico
export async function fetchProductById(id: string): Promise<ApiResponseProductById> {
  const { data } = await http.get<ApiResponseProductById>(`/api/products/${id}?populate=*`);
  return { ...data, data: mapProductNumericFields(data.data) } as ApiResponseProductById;
}

// Obtiene un producto por documentId (v5) resolviendo vía listado filtrado
export async function fetchProductByDocumentId(documentId: string): Promise<ApiResponseProductById> {
  const query = new URLSearchParams();
  query.append('filters[documentId][$eq]', documentId);
  query.append('populate', '*');

  const { data } = await http.get<ApiResponseAllProducts>(`/api/products?${query.toString()}`);
  return { data: mapProductNumericFields(data.data[0]), meta: data.meta } as unknown as ApiResponseProductById;
}

// Búsqueda simple por nombre (contains), trae relaciones por populate
export async function fetchProductsBySearch(search: string): Promise<ApiResponseAllProducts> {
  const { data } = await http.get<ApiResponseAllProducts>(`/api/products?filters[name][$contains]=${search}&populate=*`);
  return { ...data, data: mapProductsNumericFields(data.data) };
}


