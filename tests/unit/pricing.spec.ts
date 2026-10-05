import { describe, expect, it } from 'vitest'

import { getPricing, isValidSalePrice } from '@/lib/pricing'

describe('isValidSalePrice', () => {
  it('solo acepta un precio de oferta mayor que 0 y menor que el normal', () => {
    expect(isValidSalePrice(30, 40)).toBe(true)
    expect(isValidSalePrice(0.5, 1)).toBe(true)
    expect(isValidSalePrice(40, 40)).toBe(false)
    expect(isValidSalePrice(45, 40)).toBe(false)
    expect(isValidSalePrice(0, 40)).toBe(false)
    expect(isValidSalePrice(-5, 40)).toBe(false)
    expect(isValidSalePrice(null, 40)).toBe(false)
    expect(isValidSalePrice(undefined, 40)).toBe(false)
  })
})

describe('getPricing', () => {
  it('en oferta cobra el precio de oferta y muestra el anterior', () => {
    expect(getPricing({ price: 40, onSale: true, salePrice: 29.9 })).toEqual({
      price: 29.9,
      originalPrice: 40,
      onSale: true,
    })
  })

  it('sin oferta (o con el check apagado) cobra el precio normal', () => {
    const normal = { price: 40, originalPrice: null, onSale: false }
    expect(getPricing({ price: 40 })).toEqual(normal)
    expect(getPricing({ price: 40, onSale: false, salePrice: 29.9 })).toEqual(normal)
    expect(getPricing({ price: 40, onSale: null, salePrice: null })).toEqual(normal)
  })

  it('ignora una oferta inválida (sin precio, igual o mayor al normal)', () => {
    const normal = { price: 40, originalPrice: null, onSale: false }
    expect(getPricing({ price: 40, onSale: true, salePrice: null })).toEqual(normal)
    expect(getPricing({ price: 40, onSale: true, salePrice: 40 })).toEqual(normal)
    expect(getPricing({ price: 40, onSale: true, salePrice: 50 })).toEqual(normal)
  })
})
