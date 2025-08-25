import { ApiResponseAllProducts, ApiResponseProductById } from "@/types/api/product-response";
import http from "@/config/http";

interface FetchProductsParams {
  page?: number;
  pageSize?: number;
  offer?: boolean;
  category?: string;
}

export async function fetchProducts({ page = 1, pageSize = 20, offer, category }: FetchProductsParams = {}): Promise<ApiResponseAllProducts> {
  const query = new URLSearchParams();
  query.append("pagination[page]", page.toString());
  query.append("pagination[pageSize]", pageSize.toString());
  query.append("populate", "*");
  if (offer) query.append("filters[offer][$eq]", "true");
  if (category) query.append("filters[type_products][type][$eq]", category);

  const url = `/api/products?${query.toString()}`;
  const { data } = await http.get<ApiResponseAllProducts>(url);
  return data;
}

// Legacy helper used by search bar – fetches a large page to simulate "all products"
export async function fetchAllProducts(): Promise<ApiResponseAllProducts> {
  // Strapi caps pageSize; adjust if needed
  return fetchProducts({ page: 1, pageSize: 100 });
}

export async function fetchProductById(id: string): Promise<ApiResponseProductById> {
  const { data } = await http.get<ApiResponseProductById>(`/api/products/${id}?populate=*`);
  return data;
}

export async function fetchProductByDocumentId(documentId: string): Promise<ApiResponseProductById> {
  const query = new URLSearchParams();
  query.append('filters[documentId][$eq]', documentId);
  query.append('populate', '*');

  const { data } = await http.get<ApiResponseAllProducts>(`/api/products?${query.toString()}`);
  return { data: data.data[0], meta: data.meta } as unknown as ApiResponseProductById;
}