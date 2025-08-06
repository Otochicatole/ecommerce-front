const env = {
  strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL ?? "",
};

if (!env.strapiUrl) {
  throw new Error("NEXT_PUBLIC_STRAPI_URL environment variable is missing");
}

export const DEFAULT_PAGE_SIZE = 10;

export default env;
