import {
  ApiResponseAllProducts,
  ApiResponseProductById,
} from "@/types/api/product-response";

import env from "@/config";

const host = env.strapiUrl;

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

export async function fetchProductFromCategory(
  categoryId: string
): Promise<ApiResponseProductById> {
  if (!host) {
    throw new Error("API host is not defined");
  }

  const response = await fetch(
    `${host}/api/products?filters[type_products][type][$eq]=${categoryId}&populate=media`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchAllProductsOffer(): Promise<ApiResponseAllProducts> {
  if (!host) {
    throw new Error("API host is not defined");
  }

  const response = await fetch(
    `${host}/api/products?filters[offer][$eq]=true&populate=*`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}
