/** URL pública del sitio (sin "/" final), usada en sitemap, robots y metadatos. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')
