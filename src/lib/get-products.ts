import { ApiResponseAllProducts, ApiResponseProductById } from "@/types/types";

const host = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function fetchAllProducts(): Promise<ApiResponseAllProducts> {
  if (!host) {
    throw new Error("API host is not defined");
  }

  const response = await fetch(`${host}/api/products?populate=*`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchProductById(
  id: string
): Promise<ApiResponseProductById> {
  if (!host) {
    throw new Error("API host is not defined");
  }

  const response = await fetch(`${host}/api/products/${id}?populate=*`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}
