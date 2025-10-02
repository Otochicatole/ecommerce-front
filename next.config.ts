import type { NextConfig } from "next";

// Modo de entorno: usamos esto para definir una CSP más permisiva en desarrollo
// (para soportar HMR, inline bootstraps y eval) y una más estricta en producción.
const isProd = process.env.NODE_ENV === 'production';

// Parse Strapi host from env to allow remote images
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '';
let STRAPI_HOST: string | undefined;
let STRAPI_PROTO: 'http' | 'https' | undefined;
let STRAPI_ORIGIN: string | undefined;
try {
  const u = new URL(strapiUrl);
  STRAPI_HOST = u.hostname;
  STRAPI_PROTO = (u.protocol.replace(':', '') as 'http' | 'https');
  STRAPI_ORIGIN = u.origin; // includes protocol + host + port
} catch {}

// CSP para desarrollo
// - Permitimos 'unsafe-inline' y 'unsafe-eval' porque el runtime de Next en dev
//   y el HMR los necesitan para funcionar. También habilitamos ws/wss.
const cspDev = [
  "default-src 'self'",
  "img-src 'self' data: blob: https: http:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://sdk.mercadopago.com https://http2.mlstatic.com",
  "connect-src 'self' http: https: ws: wss: https://api.mercadopago.com",
  "frame-src 'self' https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// CSP para producción (más estricta)
// - Sin inline ni eval en scripts; si algún tercero lo requiere, migrar a nonces/hashes
//   o cargar el script de forma externa.
// - connect-src limitado a https en producción.
const cspProd = [
  "default-src 'self'",
  "img-src 'self' data: blob: https:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' https://sdk.mercadopago.com https://http2.mlstatic.com",
  "connect-src 'self' https: https://api.mercadopago.com",
  "frame-src 'self' https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Headers de seguridad recomendados. La CSP se ajusta por entorno con la constante anterior.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: isProd ? cspProd : cspDev },
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  images: {
    // Allow localhost and Strapi host for remote images
    domains: Array.from(new Set(["localhost", STRAPI_HOST].filter(Boolean))) as string[],
    remotePatterns: STRAPI_HOST && STRAPI_PROTO ? [
      { protocol: STRAPI_PROTO, hostname: STRAPI_HOST, pathname: "/**" },
    ] : [],
  },
  async rewrites() {
    // Proxy Strapi media/assets through same-origin to avoid mixed content and localhost leaks
    // Example: /media/uploads/abc.jpg -> proxied to <STRAPI_ORIGIN>/uploads/abc.jpg (origin preserves port)
    if (STRAPI_ORIGIN) {
      return [
        { source: '/media/:path*', destination: `${STRAPI_ORIGIN}/:path*` },
      ];
    }
    return [];
  },
  // Aumentamos el límite de payload para Server Actions (subida de archivos)
  serverActions: {
    bodySizeLimit: '25mb',
  },
  // Aplica los headers a todas las rutas de la app
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
