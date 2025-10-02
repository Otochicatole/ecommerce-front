'use client';


/**
 * Build a public image URL safe to render from the browser.
 * - If the incoming path is absolute (http/https), return as-is.
 * - If it's a Strapi relative path (starts with /uploads or /api/upload/...),
 *   prefer same-origin proxy via /media to avoid mixed content and localhost issues.
 * - Fallback to concatenating env.strapiUrl when proxy isn't available.
 */
export function getPublicImageUrl(input?: string | null): string {
  if (!input) return '/nullimg.webp';

  // Absolute URL, return directly
  if (/^https?:\/\//i.test(input)) return input;

  // Relative path coming from Strapi, try to route through our proxy
  const trimmed = input.startsWith('/') ? input.slice(1) : input;
  // Common Strapi upload base is /uploads; keep generic to support any subpath
  return `/media/${trimmed}`;
}

export default getPublicImageUrl;


