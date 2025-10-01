// Centralized cookie settings for admin token
export const ADMIN_COOKIE_NAME = process.env.NODE_ENV === 'production'
  ? '__Host-admin_token'
  : 'admin_token';

export const ADMIN_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60, // 1 hour
};


