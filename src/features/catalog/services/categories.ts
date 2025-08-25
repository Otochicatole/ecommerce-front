import { ApiResponseAllCategories } from "@/types/api/category-response";
import env from "@/config";
import http from "@/config/http";

const host = env.strapiUrl;

export async function fetchAllCategories(): Promise<ApiResponseAllCategories> {
  if (!host) throw new Error("API host is not defined");
  const { data } = await http.get<ApiResponseAllCategories>(`/api/type-products?populate=*`);
  return data;
}
