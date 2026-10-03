import 'server-only'

import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'

/** Configuración global del sitio; `cache` evita consultarla varias veces por request. */
export const getSiteConfig = cache(async () => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-config', depth: 1 })
})
