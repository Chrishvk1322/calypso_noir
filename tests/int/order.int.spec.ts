import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { generateKeyBetween } from 'payload/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'
import {
  getAccessoryProducts,
  getCatalog,
  getCollectionsFeed,
  getProductPreviews,
  getRelatedProducts,
  searchCatalog,
} from '@/lib/queries'
import { backfillManualOrder } from '@/migrations/20261008_050836_manual_order'
import type { Collection, Product } from '@/payload-types'

let payload: Payload
let typeId: number
let luna: Collection
let sol: Collection

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'accessory-types', 'collections'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

const createProduct = (name: string, collection: number) =>
  payload.create({
    collection: 'products',
    data: { name, price: 20, stock: 1, collection, accessoryType: typeId },
    depth: 0,
  })

/** Lo que hace el admin al arrastrar: una clave nueva entre dos vecinos. */
const moveBefore = async (slug: 'collections' | 'products', id: number, beforeKey: string | null | undefined) => {
  const field = slug === 'collections' ? '_order' : '_products_products_order'
  await payload.update({
    collection: slug,
    id,
    data: { [field]: generateKeyBetween(null, beforeKey ?? null) },
  })
}

const productOrder = async (id: number) =>
  (await payload.findByID({ collection: 'products', id, depth: 0 }))._products_products_order

const names = (docs: { name?: string; title?: string }[]) => docs.map((doc) => doc.name ?? doc.title)

describe('Orden manual desde el admin', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()
    typeId = (await payload.create({ collection: 'accessory-types', data: { title: 'Orden QA' } })).id
    luna = await payload.create({ collection: 'collections', data: { title: 'Luna' } })
    sol = await payload.create({ collection: 'collections', data: { title: 'Sol' } })
    for (const name of ['Luna 1', 'Luna 2', 'Luna 3']) await createProduct(name, luna.id)
    for (const name of ['Sol 1', 'Sol 2']) await createProduct(name, sol.id)
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('lo nuevo aparece primero', () => {
    it('colecciones: en la Home y el catálogo', async () => {
      expect(names((await getCollectionsFeed()).collections)).toEqual(['Sol', 'Luna'])
      expect(names((await getCatalog()).collections)).toEqual(['Sol', 'Luna'])
    })

    it('productos: primero dentro de su colección, sin afectar a las demás', async () => {
      expect(names((await getProductPreviews(luna.id, 12)).products)).toEqual(['Luna 3', 'Luna 2', 'Luna 1'])
      expect(names((await getProductPreviews(sol.id, 12)).products)).toEqual(['Sol 2', 'Sol 1'])
    })

    it('un producto que se cambia de colección queda primero en la nueva', async () => {
      const moved = await createProduct('Viajero', luna.id)
      await payload.update({ collection: 'products', id: moved.id, data: { collection: sol.id } })
      expect(names((await getProductPreviews(sol.id, 12)).products)).toEqual(['Viajero', 'Sol 2', 'Sol 1'])
      await payload.delete({ collection: 'products', id: moved.id })
    })

    it('editar otro campo no cambia la posición', async () => {
      const { docs } = await payload.find({ collection: 'products', where: { name: { equals: 'Luna 1' } } })
      await payload.update({ collection: 'products', id: docs[0].id, data: { stock: 5, collection: luna.id } })
      expect(names((await getProductPreviews(luna.id, 12)).products)).toEqual(['Luna 3', 'Luna 2', 'Luna 1'])
    })
  })

  describe('al reordenar en el admin', () => {
    beforeAll(async () => {
      // Luna antes que Sol; "Luna 1" al inicio de Luna.
      const { docs } = await payload.find({ collection: 'collections', sort: '_order', depth: 0 })
      await moveBefore('collections', luna.id, docs[0]._order)
      const l1 = (await payload.find({ collection: 'products', where: { name: { equals: 'Luna 1' } } })).docs[0]
      const l3 = (await payload.find({ collection: 'products', where: { name: { equals: 'Luna 3' } } })).docs[0]
      await moveBefore('products', l1.id, await productOrder(l3.id))
    })

    it('la Home, el catálogo y la colección usan el nuevo orden', async () => {
      const feed = await getCollectionsFeed()
      expect(names(feed.collections)).toEqual(['Luna', 'Sol'])
      expect(names(feed.collections[0].products)).toEqual(['Luna 1', 'Luna 3', 'Luna 2'])
      expect(names((await getCatalog()).collections)).toEqual(['Luna', 'Sol'])
    })

    it('los relacionados siguen el orden de la colección', async () => {
      const l2 = (await payload.find({ collection: 'products', where: { name: { equals: 'Luna 2' } } })).docs[0]
      expect(names(await getRelatedProducts(luna.id, l2.id))).toEqual(['Luna 1', 'Luna 3'])
    })

    it('accesorios y búsqueda no usan el orden manual: más recientes primero', async () => {
      const expected = ['Sol 2', 'Sol 1', 'Luna 3', 'Luna 2', 'Luna 1']
      expect(names((await getAccessoryProducts(typeId, 12)).products)).toEqual(expected)
      expect(names((await searchCatalog('luna', 12)).products)).toEqual(['Luna 3', 'Luna 2', 'Luna 1'])
    })

    it('la paginación es estable', async () => {
      const pages = await Promise.all([1, 2].map((page) => getProductPreviews(luna.id, 2, page)))
      expect(pages.flatMap((p) => names(p.products))).toEqual(['Luna 1', 'Luna 3', 'Luna 2'])
    })
  })

  describe('migración', () => {
    it('el relleno asigna el orden anterior (más reciente primero) y no pisa un orden elegido', async () => {
      const db = payload.db.drizzle
      // Simula una base anterior a la migración: Sol sin clave y los productos de Sol sin clave.
      await db.execute(sql`UPDATE collections SET _order = NULL WHERE id = ${sol.id}`)
      await db.execute(sql`UPDATE products SET _products_products_order = NULL WHERE collection_id = ${sol.id}`)
      const before = await payload.find({ collection: 'products', where: { collection: { equals: luna.id } } })
      const lunaKeys = before.docs.map((p: Product) => [p.id, p._products_products_order])

      await backfillManualOrder(db as never)

      const solProducts = await payload.find({
        collection: 'products',
        where: { collection: { equals: sol.id } },
        sort: '_products_products_order',
      })
      expect(names(solProducts.docs)).toEqual(['Sol 2', 'Sol 1'])
      expect((await payload.findByID({ collection: 'collections', id: sol.id }))._order).toBeTruthy()
      const after = await payload.find({ collection: 'products', where: { collection: { equals: luna.id } } })
      expect(after.docs.map((p: Product) => [p.id, p._products_products_order])).toEqual(lunaKeys)
    })
  })
})
