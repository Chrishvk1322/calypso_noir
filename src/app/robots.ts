import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  // Entornos de prueba o demo: no indexar nada (DISALLOW_INDEXING=1 al construir).
  if (process.env.DISALLOW_INDEXING === '1') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // El panel de administración y la API no deben indexarse.
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
