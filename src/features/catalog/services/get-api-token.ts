export function getApiTokenOrThrow(): string {
    const token = process.env.STRAPI_API_TOKEN;
    if (!token) throw new Error('Missing STRAPI_API_TOKEN for Content API');
    return token;
  }