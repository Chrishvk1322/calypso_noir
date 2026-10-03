import 'server-only'

import { cache } from 'react'

import { CACHE_TAGS, cached } from '@/lib/cache'
import { getPayloadClient } from '@/lib/payload'

const fetchSiteConfig = async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-config', depth: 1 })
}

/**
 * Configuración global del sitio: cacheada entre visitas (se invalida al guardarla en el admin)
 * y deduplicada dentro de cada render con `cache` de React.
 */
export const getSiteConfig = cache(
  cached(fetchSiteConfig, 'site-config', [CACHE_TAGS.siteConfig, CACHE_TAGS.media]),
)
