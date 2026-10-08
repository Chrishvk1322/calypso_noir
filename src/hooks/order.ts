import type { CollectionBeforeChangeHook, PayloadRequest, Where } from 'payload'
import { generateKeyBetween } from 'payload/shared'

import type { Collection, Product } from '@/payload-types'

/**
 * Orden manual definido en el admin (arrastrar y soltar). Payload guarda claves de orden
 * fraccional en campos ocultos y por defecto pone lo nuevo al final; estos hooks lo ponen al
 * inicio, que es donde la dueña espera ver una pieza recién creada. Corren antes que el hook
 * de Payload, que solo asigna una clave si el campo está vacío.
 */
export const COLLECTION_ORDER_FIELD = '_order'
/** Orden de los productos dentro de su colección (join `products` de Collections, orderable). */
export const PRODUCT_ORDER_FIELD = '_products_products_order'

/** Clave anterior a la primera del grupo (`where`), para quedar primero. */
const firstKey = async (
  req: PayloadRequest,
  collection: 'collections' | 'products',
  field: string,
  where?: Where,
) => {
  const { docs } = await req.payload.find({
    collection,
    where: { and: [{ [field]: { exists: true } }, ...(where ? [where] : [])] },
    sort: field,
    limit: 1,
    depth: 0,
    pagination: false,
    select: { [field]: true },
    overrideAccess: true,
    req,
  })
  const current = (docs[0] as unknown as Record<string, string | null> | undefined)?.[field]
  return generateKeyBetween(null, current ?? null)
}

const relationId = (value: unknown) =>
  value && typeof value === 'object' ? (value as { id: number }).id : (value as number | null | undefined)

/** Colección nueva (o duplicada) → primera en la Home y el catálogo. */
export const placeCollectionFirst: CollectionBeforeChangeHook<Collection> = async ({ data, operation, req }) => {
  if (operation === 'create' && !data._order) {
    data._order = await firstKey(req, 'collections', COLLECTION_ORDER_FIELD)
  }
  return data
}

/** Producto nuevo, o que se cambia de colección → primero en su colección. */
export const placeProductFirst: CollectionBeforeChangeHook<Product> = async ({ data, operation, originalDoc, req }) => {
  const collectionId = relationId(data.collection) ?? relationId(originalDoc?.collection)
  if (!collectionId) return data

  const moved =
    operation === 'update' && data.collection !== undefined && collectionId !== relationId(originalDoc?.collection)
  if ((operation === 'create' && !data._products_products_order) || moved) {
    data._products_products_order = await firstKey(req, 'products', PRODUCT_ORDER_FIELD, {
      collection: { equals: collectionId },
    })
  }
  return data
}
