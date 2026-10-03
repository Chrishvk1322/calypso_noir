import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
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
