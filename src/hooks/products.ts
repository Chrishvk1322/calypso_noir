import type { CollectionBeforeChangeHook } from 'payload'

import { toSortName } from '@/lib/filters'
import { getPricing } from '@/lib/pricing'
import type { Product } from '@/payload-types'

/**
 * Campos ocultos para ordenar en la base: `effectivePrice` (precio que se cobra, el de oferta si
 * aplica) y `sortName` (nombre en minúsculas y sin tildes). Las actualizaciones parciales (p. ej.
 * el stock que descuenta un pedido) no traen todos los campos: se completan con el original.
 */
export const setSortFields: CollectionBeforeChangeHook<Product> = ({ data, originalDoc }) => {
  const name = data.name ?? originalDoc?.name
  if (name) data.sortName = toSortName(name)

  const price = data.price ?? originalDoc?.price
  if (typeof price !== 'number') return data

  data.effectivePrice = getPricing({
    price,
    onSale: data.onSale ?? originalDoc?.onSale,
    salePrice: data.salePrice !== undefined ? data.salePrice : originalDoc?.salePrice,
  }).price
  return data
}
