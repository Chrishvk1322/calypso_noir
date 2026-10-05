import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { parsePage } from '@/lib/format'
import { getImage } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'
import {
  COLLECTIONS_PER_PAGE,
  getCatalog,
  getCollectionBySlug,
  getCollectionsFeed,
  getHeroSlides,
  getProductPreviews,
} from '@/lib/queries'

let payload: Payload

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

// 12 colecciones activas (C01 la más antigua … C12 la más reciente) + 1 inactiva.
const TOTAL_ACTIVE = 12
const ids: number[] = []

describe('Consultas del frontend (Fase 4)', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    for (let i = 1; i <= TOTAL_ACTIVE; i++) {
      const label = String(i).padStart(2, '0')
      const collection = await payload.create({
        collection: 'collections',
        data: { title: `C${label}` },
      })
      ids.push(collection.id)
    }

    // C12 (la más reciente): 6 productos activos (P1 más antiguo … P6 más reciente) + 1 inactivo.
    const newest = ids[ids.length - 1]
    for (let i = 1; i <= 6; i++) {
      await payload.create({
        collection: 'products',
        data: { name: `P${i}`, price: 10 * i, stock: i, collection: newest },
      })
    }
    await payload.create({
      collection: 'products',
      data: { name: 'Oculto', price: 1, stock: 1, collection: newest, active: false },
    })
    // C11: 2 productos.
    for (const name of ['Q1', 'Q2']) {
      await payload.create({
        collection: 'products',
        data: { name, price: 5, stock: 1, collection: ids[ids.length - 2] },
      })
    }

    // Colección inactiva creada al final (sería la "más reciente" si no se filtrara).
    await payload.create({
      collection: 'collections',
      data: { title: 'Borrador', active: false },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('getCollectionsFeed', () => {
    it('ordena de la más reciente a la más antigua y excluye inactivas', async () => {
      const { collections } = await getCollectionsFeed(1)
      expect(collections.map((c) => c.title)).toEqual(
        ['C12', 'C11', 'C10', 'C09', 'C08', 'C07', 'C06', 'C05', 'C04', 'C03'],
      )
    })

    it('pagina de a 10 colecciones', async () => {
      const first = await getCollectionsFeed(1)
      const second = await getCollectionsFeed(2)
      expect(COLLECTIONS_PER_PAGE).toBe(10)
      expect(first.collections).toHaveLength(10)
      expect(first.pagination).toEqual({ page: 1, totalPages: 2, totalDocs: TOTAL_ACTIVE })
      expect(second.collections.map((c) => c.title)).toEqual(['C02', 'C01'])
      expect(second.pagination.page).toBe(2)
    })

    it('una página fuera de rango devuelve vacío', async () => {
      const { collections } = await getCollectionsFeed(99)
      expect(collections).toHaveLength(0)
    })

    it('muestra los 4 productos activos más recientes de cada colección', async () => {
      const { collections } = await getCollectionsFeed(1)
      const [c12, c11, c10] = collections
      expect(c12.products.map((p) => p.name)).toEqual(['P6', 'P5', 'P4', 'P3'])
      expect(c12.productCount).toBe(6) // el inactivo no cuenta
      expect(c11.products.map((p) => p.name)).toEqual(['Q2', 'Q1'])
      expect(c10.products).toEqual([])
      expect(c10.productCount).toBe(0)
    })

    it('trae solo los campos que necesita la tarjeta de producto', async () => {
      const { collections } = await getCollectionsFeed(1)
      const product = collections[0].products[0]
      expect(Object.keys(product).sort()).toEqual(
        ['createdAt', 'id', 'images', 'name', 'onSale', 'price', 'salePrice', 'slug', 'stock'].sort(),
      )
    })
  })

  describe('getProductPreviews (página de colección)', () => {
    it('pagina los productos de una colección', async () => {
      const newest = ids[ids.length - 1]
      const page1 = await getProductPreviews(newest, 4, 1)
      const page2 = await getProductPreviews(newest, 4, 2)
      expect(page1.products.map((p) => p.name)).toEqual(['P6', 'P5', 'P4', 'P3'])
      expect(page2.products.map((p) => p.name)).toEqual(['P2', 'P1'])
      expect(page1.pagination).toEqual({ page: 1, totalPages: 2, totalDocs: 6 })
    })
  })

  describe('getCatalog', () => {
    it('lista colecciones activas paginadas de a 12', async () => {
      const { collections, pagination } = await getCatalog(1)
      expect(collections).toHaveLength(12)
      expect(collections.some((c) => c.title === 'Borrador')).toBe(false)
      expect(pagination.totalPages).toBe(1)
    })
  })

  describe('getCollectionBySlug', () => {
    it('encuentra una colección activa por slug', async () => {
      const collection = await getCollectionBySlug('c12')
      expect(collection?.title).toBe('C12')
    })

    it('devuelve null para slugs inexistentes o colecciones inactivas', async () => {
      expect(await getCollectionBySlug('no-existe')).toBeNull()
      expect(await getCollectionBySlug('borrador')).toBeNull()
    })
  })

  describe('getHeroSlides', () => {
    it('ordena por "order" y no enlaza colecciones inactivas', async () => {
      const inactive = await payload.find({ collection: 'collections', where: { active: { equals: false } } })
      await payload.create({ collection: 'hero-slides', data: { title: 'Segundo', order: 2, collectionLink: ids[0] } })
      await payload.create({ collection: 'hero-slides', data: { title: 'Primero', order: 1, collectionLink: ids[1] } })
      await payload.create({
        collection: 'hero-slides',
        data: { title: 'Tercero', order: 3, collectionLink: inactive.docs[0].id },
      })

      const slides = await getHeroSlides()
      expect(slides.map((s) => s.title)).toEqual(['Primero', 'Segundo', 'Tercero'])
      expect(typeof slides[0].collectionLink).toBe('object')
      // La colección inactiva no se puebla para el público: queda como id o null.
      expect(typeof slides[2].collectionLink === 'object' && slides[2].collectionLink !== null).toBe(false)
    })
  })
})

describe('Utilidades de presentación', () => {
  it('parsePage acepta solo enteros ≥ 1', () => {
    expect(parsePage('3')).toBe(3)
    expect(parsePage(['2', '5'])).toBe(2)
    for (const value of [undefined, '', '0', '-1', '1.5', 'abc']) {
      expect(parsePage(value)).toBe(1)
    }
  })

  it('getImage usa el tamaño pedido, cae al original y agrega la versión', () => {
    const media = {
      id: 1,
      alt: 'Foto',
      url: 'http://localhost:3000/api/media/file/a.webp',
      width: 2000,
      height: 1500,
      updatedAt: '2026-10-03T00:00:00.000Z',
      createdAt: '2026-10-03T00:00:00.000Z',
      sizes: {
        card: { url: 'http://localhost:3000/api/media/file/a-600x750.webp', width: 600, height: 750 },
        hero: { url: null, width: null, height: null },
      },
    } as never

    const v = `?v=${Date.parse('2026-10-03T00:00:00.000Z')}`
    expect(getImage(media, 'card')).toEqual({ url: `/api/media/file/a-600x750.webp${v}`, alt: 'Foto', width: 600, height: 750 })
    expect(getImage(media, 'hero')?.url).toBe(`/api/media/file/a.webp${v}`)
    expect(getImage(7)).toBeNull()
    expect(getImage(null)).toBeNull()
  })
})
