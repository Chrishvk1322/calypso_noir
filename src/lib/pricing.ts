import type { Product } from '@/payload-types'

type PriceFields = Pick<Product, 'price'> & Partial<Pick<Product, 'onSale' | 'salePrice'>>

export type Pricing = {
  /** Precio a cobrar: el de oferta si aplica. */
  price: number
  /** Precio anterior (tachado) si el producto está en oferta; si no, null. */
  originalPrice: number | null
  onSale: boolean
}

/** Una oferta solo vale si su precio es mayor que 0 y menor que el precio normal. */
export const isValidSalePrice = (salePrice: number | null | undefined, price: number | null | undefined) =>
  typeof salePrice === 'number' && typeof price === 'number' && salePrice > 0 && salePrice < price

/**
 * Precio de un producto según su oferta. Es la única fuente de verdad: la usan el checkout
 * (lo que se cobra), las tarjetas, el detalle, el buscador y el hook que guarda `effectivePrice`.
 */
export function getPricing({ price, onSale, salePrice }: PriceFields): Pricing {
  if (onSale && isValidSalePrice(salePrice, price)) {
    return { price: salePrice as number, originalPrice: price, onSale: true }
  }
  return { price, originalPrice: null, onSale: false }
}
