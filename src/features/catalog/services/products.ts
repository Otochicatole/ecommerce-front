import { ApiResponseAllProducts, ApiResponseProductById } from "@/types/api/product-response";
import env from "@/config";

const host = env.strapiUrl;

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

  const url = `${host}/api/products?${query.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch products: ${response.statusText}`);
  return response.json();
}

// Legacy helper used by search bar – fetches a large page to simulate "all products"
export async function fetchAllProducts(): Promise<ApiResponseAllProducts> {
  // Strapi caps pageSize; adjust if needed
  return fetchProducts({ page: 1, pageSize: 100 });
}

export async function fetchProductById(id: string): Promise<ApiResponseProductById> {
  const response = await fetch(`${host}/api/products/${id}?populate=*`);
  if (!response.ok) throw new Error(`Failed to fetch product: ${response.statusText}`);
  return response.json();
}
