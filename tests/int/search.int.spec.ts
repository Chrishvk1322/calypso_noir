import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'
import { searchCatalog } from '@/lib/queries'

let payload: Payload

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

describe('Buscador', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    const halloween = await payload.create({
      collection: 'collections',
      data: { title: 'Colección Halloween', description: 'Piezas de terror para octubre.' },
    })
    const luna = await payload.create({ collection: 'collections', data: { title: 'Luna Terracota' } })
    await payload.create({ collection: 'collections', data: { title: 'Luna Oculta', active: false } })

    await payload.create({ collection: 'products', data: { name: 'Aretes Media Luna', price: 42, stock: 3, collection: luna.id } })
    await payload.create({ collection: 'products', data: { name: 'Arete Calabaza', price: 30, stock: 0, collection: halloween.id } })
    await payload.create({
      collection: 'products',
      data: { name: 'Luna inactiva', price: 1, stock: 1, collection: luna.id, active: false },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  it('separa resultados de colecciones y productos', async () => {
    const results = await searchCatalog('luna')
    expect(results.collections.map((c) => c.title)).toEqual(['Luna Terracota'])
    expect(results.products.map((p) => p.name)).toEqual(['Aretes Media Luna'])
  })

  it('no distingue mayúsculas ni acentos', async () => {
    expect((await searchCatalog('COLECCION')).collections.map((c) => c.title)).toEqual(['Colección Halloween'])
    expect((await searchCatalog('colección')).collections.map((c) => c.title)).toEqual(['Colección Halloween'])
  })

  it('busca también en la descripción de las colecciones', async () => {
    expect((await searchCatalog('terror')).collections.map((c) => c.title)).toEqual(['Colección Halloween'])
  })

  it('incluye productos agotados pero nunca inactivos ni de colecciones ocultas', async () => {
    expect((await searchCatalog('calabaza')).products.map((p) => [p.name, p.stock])).toEqual([['Arete Calabaza', 0]])
    expect((await searchCatalog('inactiva')).products).toEqual([])
    expect((await searchCatalog('oculta')).collections).toEqual([])
  })

  it('ignora búsquedas de menos de 2 letras y respeta el límite', async () => {
    expect(await searchCatalog('a')).toEqual({ collections: [], products: [] })
    expect((await searchCatalog('ar', 1)).products).toHaveLength(1)
  })
})
