import type { MetadataRoute } from 'next'

import { getSitemapEntries } from '@/lib/queries'
import { SITE_URL } from '@/lib/site-url'

// Se genera en cada petición (con las consultas cacheadas) para no depender de la base de
// datos durante el build y reflejar al instante lo que se publique en el admin.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { collections, products } = await getSitemapEntries()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/sobre-mi`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [
    ...staticPages,
    ...collections.map((c) => ({
      url: `${SITE_URL}/colecciones/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/productos/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
