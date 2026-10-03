import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import type { CacheTag } from '@/lib/cache'

/**
 * Invalida etiquetas de caché del frontend. Con `{ expire: 0 }` la siguiente visita ya trae los
 * datos nuevos (sin servir la versión anterior mientras revalida).
 *
 * Fuera del servidor de Next (seed, pruebas) `revalidateTag` no está disponible: se ignora para
 * no romper la escritura. También se puede desactivar con `context.disableRevalidate`.
 */
export const revalidateTags = (tags: CacheTag[], req: PayloadRequest) => {
  if (req.context?.disableRevalidate || !process.env.NEXT_RUNTIME) return
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 })
    } catch (error) {
      req.payload.logger.warn({ err: error, tag }, 'No se pudo revalidar la caché')
    }
  }
}

export const revalidateAfterChange =
  (tags: CacheTag[]): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    revalidateTags(tags, req)
    return doc
  }

export const revalidateAfterDelete =
  (tags: CacheTag[]): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    revalidateTags(tags, req)
    return doc
  }

export const revalidateGlobalAfterChange =
  (tags: CacheTag[]): GlobalAfterChangeHook =>
  ({ doc, req }) => {
    revalidateTags(tags, req)
    return doc
  }
