import { ApiResponseAllCategories } from "@/types/api/category-response";

const host = process.env.NEXT_PUBLIC_STRAPI_URL;

export async function fetchAllCategories(): Promise<ApiResponseAllCategories> {
  if (!host) {
    throw new Error("API host is not defined");
  }

  const response = await fetch(`${host}/api/type-products?populate=*`);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}
