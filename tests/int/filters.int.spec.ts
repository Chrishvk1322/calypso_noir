import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { ProductFilters, SortKey } from '@/lib/filters'
import { getPayloadClient } from '@/lib/payload'
import { getAccessoryProducts, getProductPreviews, searchCatalog } from '@/lib/queries'
import type { Product } from '@/payload-types'

let payload: Payload
let collectionId: number
let typeId: number

const cleanDatabase = async () => {
  for (const slug of ['orders', 'products', 'accessory-types', 'collections'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

// Precio que se cobra entre paréntesis: el orden por precio debe usar el de oferta.
const SEED: (Partial<Product> & { name: string; price: number })[] = [
  { name: 'Broche Ébano', price: 30 }, // (30)
  { name: 'anillo Luna', price: 50, onSale: true, salePrice: 20 }, // (20) en oferta
  { name: 'Ánfora Collar', price: 45 }, // (45)
  { name: 'Zarcillo Sol', price: 25, onSale: true, salePrice: 22 }, // (22) en oferta
  { name: 'Collar Órbita', price: 60 }, // (60)
]

const names = (products: { name: string }[]) => products.map((p) => p.name)
const filters = (sort: SortKey, onSale = false): ProductFilters => ({ sort, onSale })

describe('Mejora 8.8: filtros de oferta y orden', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()
    collectionId = (await payload.create({ collection: 'collections', data: { title: 'Filtros QA' } })).id
    typeId = (await payload.create({ collection: 'accessory-types', data: { title: 'Varios QA' } })).id
    for (const product of SEED) {
      await payload.create({
        collection: 'products',
        data: { stock: 2, collection: collectionId, accessoryType: typeId, ...product },
      })
    }
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  it('el hook guarda sortName normalizado y lo actualiza al renombrar', async () => {
    const { docs } = await payload.find({ collection: 'products', where: { name: { equals: 'Ánfora Collar' } } })
    expect(docs[0].sortName).toBe('anfora collar')
    const renamed = await payload.update({ collection: 'products', id: docs[0].id, data: { name: 'Ánfora Collar II' } })
    expect(renamed.sortName).toBe('anfora collar ii')
    await payload.update({ collection: 'products', id: docs[0].id, data: { name: 'Ánfora Collar' } })
  })

  describe('getProductPreviews (colección)', () => {
    const list = (f: ProductFilters, limit = 12, page = 1) => getProductPreviews(collectionId, limit, page, f)

    it('más recientes primero por defecto', async () => {
      expect(names((await list(filters('recientes'))).products)).toEqual([...SEED].reverse().map((p) => p.name))
    })

    it('por precio usa el precio de oferta', async () => {
      const asc = ['anillo Luna', 'Zarcillo Sol', 'Broche Ébano', 'Ánfora Collar', 'Collar Órbita']
      expect(names((await list(filters('precio-asc'))).products)).toEqual(asc)
      expect(names((await list(filters('precio-desc'))).products)).toEqual([...asc].reverse())
    })

    it('por nombre ignora mayúsculas y tildes', async () => {
      const az = ['Ánfora Collar', 'anillo Luna', 'Broche Ébano', 'Collar Órbita', 'Zarcillo Sol']
      expect(names((await list(filters('nombre-asc'))).products)).toEqual(az)
      expect(names((await list(filters('nombre-desc'))).products)).toEqual([...az].reverse())
    })

    it('el filtro de oferta deja solo productos en oferta y se combina con el orden', async () => {
      const { products, pagination } = await list(filters('precio-desc', true))
      expect(names(products)).toEqual(['Zarcillo Sol', 'anillo Luna'])
      expect(pagination.totalDocs).toBe(2)
    })

    it('pagina de forma estable con el orden elegido', async () => {
      const pages = await Promise.all([1, 2, 3].map((page) => list(filters('nombre-asc'), 2, page)))
      expect(pages.flatMap((p) => names(p.products))).toEqual([
        'Ánfora Collar',
        'anillo Luna',
        'Broche Ébano',
        'Collar Órbita',
        'Zarcillo Sol',
      ])
      expect(pages[0].pagination.totalPages).toBe(3)
    })
  })

  it('getAccessoryProducts aplica los mismos filtros', async () => {
    const { products } = await getAccessoryProducts(typeId, 12, 1, filters('precio-asc', true))
    expect(names(products)).toEqual(['anillo Luna', 'Zarcillo Sol'])
  })

  it('searchCatalog filtra y ordena solo los productos', async () => {
    const { collections, products } = await searchCatalog('collar', 24, filters('nombre-desc'))
    expect(names(products)).toEqual(['Collar Órbita', 'Ánfora Collar'])
    expect(collections).toEqual([])
    const onSale = await searchCatalog('collar', 24, filters('recientes', true))
    expect(onSale.products).toEqual([])
  })
})
