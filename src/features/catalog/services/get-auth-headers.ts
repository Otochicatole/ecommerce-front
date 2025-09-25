export function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.STRAPI_API_TOKEN) headers.Authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
    return headers;
  }