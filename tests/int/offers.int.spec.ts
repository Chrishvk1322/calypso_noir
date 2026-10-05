import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { GET as searchApi, type SearchResponse } from '@/app/(frontend)/api/search/route'
import { createOrderFromCart } from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'
import { getProductBySlug, getProductPreviews } from '@/lib/queries'
import type { Product } from '@/payload-types'

let payload: Payload
let collectionId: number
let product: Product // precio 40, en oferta a 30

const cleanDatabase = async () => {
  for (const slug of ['orders', 'products', 'collections'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

const update = (data: Partial<Product>) => payload.update({ collection: 'products', id: product.id, data })

describe('Mejora 8.6: ofertas', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()
    collectionId = (await payload.create({ collection: 'collections', data: { title: 'Ofertas QA' } })).id
    product = await payload.create({
      collection: 'products',
      data: { name: 'Broche Oferta', price: 40, stock: 5, collection: collectionId, onSale: true, salePrice: 30 },
    })
    await payload.updateGlobal({
      slug: 'site-config',
      data: { whatsappNumber: '51964588065', whatsappMessageTemplate: 'Pedido {orderCode} por S/.{totalAmount}' },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('modelo', () => {
    it('onSale es false por defecto y effectivePrice = price', async () => {
      const normal = await payload.create({
        collection: 'products',
        data: { name: 'Sin oferta', price: 25, stock: 1, collection: collectionId },
      })
      expect(normal.onSale).toBe(false)
      expect(normal.effectivePrice).toBe(25)
    })

    it('en oferta guarda effectivePrice = salePrice', () => {
      expect(product.effectivePrice).toBe(30)
    })

    it('exige un precio de oferta válido cuando está en oferta', async () => {
      const base = { name: 'Inválido', price: 40, stock: 1, collection: collectionId, onSale: true }
      await expect(payload.create({ collection: 'products', data: base })).rejects.toThrow()
      await expect(payload.create({ collection: 'products', data: { ...base, salePrice: 40 } })).rejects.toThrow()
      await expect(payload.create({ collection: 'products', data: { ...base, salePrice: 55 } })).rejects.toThrow()
      await expect(payload.create({ collection: 'products', data: { ...base, salePrice: 0 } })).rejects.toThrow()
    })

    it('recalcula effectivePrice al apagar la oferta o cambiar precios, y lo conserva en cambios de stock', async () => {
      expect((await update({ stock: 3 })).effectivePrice).toBe(30) // actualización parcial (como un pedido)
      expect((await update({ salePrice: 35 })).effectivePrice).toBe(35)
      expect((await update({ onSale: false })).effectivePrice).toBe(40)
      expect((await update({ price: 45 })).effectivePrice).toBe(45)
      product = await update({ price: 40, onSale: true, salePrice: 30, stock: 5 })
      expect(product.effectivePrice).toBe(30)
    })
  })

  describe('tienda', () => {
    it('las consultas públicas traen onSale y salePrice', async () => {
      const { products } = await getProductPreviews(collectionId, 12, 1)
      expect(products.find((p) => p.id === product.id)).toMatchObject({ price: 40, onSale: true, salePrice: 30 })
      expect(await getProductBySlug(product.slug!)).toMatchObject({ onSale: true, salePrice: 30 })
    })

    it('la API del buscador devuelve el precio de oferta y el anterior', async () => {
      const response = await searchApi(new Request('http://localhost/api/search?q=broche oferta'))
      const body = (await response.json()) as SearchResponse
      expect(body.products.find((p) => p.id === product.id)).toMatchObject({ price: 30, originalPrice: 40 })
    })
  })

  describe('checkout', () => {
    it('cobra el precio de oferta y lo guarda en el pedido', async () => {
      const result = await createOrderFromCart(payload, {
        customerName: 'Ana Pérez',
        customerPhone: '987654321',
        items: [{ productId: product.id, quantity: 2 }],
      })
      expect(result.status).toBe(201)
      if (result.status !== 201) return
      expect(result.body.totalAmount).toBe(60)

      const order = await payload.find({ collection: 'orders', where: { orderCode: { equals: result.body.orderCode } } })
      expect(order.docs[0].items?.[0]).toMatchObject({ quantity: 2, unitPrice: 30 })
      expect(order.docs[0].totalAmount).toBe(60)
    })

    it('si la oferta termina, cobra el precio normal', async () => {
      await update({ onSale: false })
      const result = await createOrderFromCart(payload, {
        customerName: 'Ana Pérez',
        customerPhone: '987654321',
        items: [{ productId: product.id, quantity: 1 }],
      })
      expect(result.status).toBe(201)
      if (result.status === 201) expect(result.body.totalAmount).toBe(40)
      product = await update({ onSale: true })
    })
  })
})
