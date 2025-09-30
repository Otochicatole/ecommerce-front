import axios from "axios";
import env from "@/config";

// Resolve numeric id by documentId for any collection type
// resource examples: 'products', 'sizes', 'type-products'
export async function resolveNumericIdByDocumentId(resource: string, documentId: string): Promise<string> {
  const { data } = await axios.get(`${env.strapiUrl}/api/${resource}`, {
    params: { 'filters[documentId][$eq]': documentId },
    headers: { Accept: 'application/json' },
  });
  const entry = Array.isArray(data?.data) ? data.data[0] : undefined;
  const resolvedId = entry?.id ?? entry?.attributes?.id;
  if (!resolvedId) throw new Error(`${resource} not found`);
  return String(resolvedId);
}


