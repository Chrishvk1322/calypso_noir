import { unstable_cache } from 'next/cache'

/**
 * Etiquetas de caché: una por colección/global de Payload. Las consultas del frontend se
 * etiquetan con todo lo que leen, y los hooks de Payload (src/hooks/revalidate.ts) invalidan
 * la etiqueta correspondiente al guardar en el admin.
 */
export const CACHE_TAGS = {
  collections: 'collections',
  accessoryTypes: 'accessory-types',
  products: 'products',
  heroSlides: 'hero-slides',
  media: 'media',
  siteConfig: 'site-config',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

/**
 * Cachea una consulta con `unstable_cache`. Fuera del servidor de Next (pruebas con Vitest,
 * scripts como el seed) no existe la caché incremental, así que se llama la función directo.
 */
export function cached<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  key: string,
  tags: CacheTag[],
): (...args: Args) => Promise<Result> {
  if (!process.env.NEXT_RUNTIME) return fn
  return unstable_cache(fn, [key], { tags })
}
