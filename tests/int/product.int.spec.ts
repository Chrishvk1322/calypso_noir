import type { Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'
import { getProductBySlug, getRelatedProducts } from '@/lib/queries'
import { toPlainText } from '@/lib/richtext'

let payload: Payload

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

const richText = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      textFormat: 0,
      children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

describe('Detalle de producto (Fase 5)', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    const data = await sharp({ create: { width: 1600, height: 2000, channels: 3, background: '#a0583c' } })
      .jpeg()
      .toBuffer()
    const image = await payload.create({
      collection: 'media',
      data: { alt: 'Foto' },
      file: { data, mimetype: 'image/jpeg', name: 'detalle.jpg', size: data.length },
    })

    const active = await payload.create({ collection: 'collections', data: { title: 'Activa' } })
    const hidden = await payload.create({ collection: 'collections', data: { title: 'Oculta', active: false } })

    await payload.create({
      collection: 'products',
      data: {
        name: 'Aretes Luna',
        price: 42,
        stock: 3,
        collection: active.id,
        images: [image.id],
        description: richText('Pieza hecha a mano.', 'Ligera y resistente.'),
      },
    })
    for (const name of ['Collar Sol', 'Anillo Mar']) {
      await payload.create({ collection: 'products', data: { name, price: 30, stock: 1, collection: active.id } })
    }
    await payload.create({
      collection: 'products',
      data: { name: 'Inactivo', price: 1, stock: 1, collection: active.id, active: false },
    })
    await payload.create({
      collection: 'products',
      data: { name: 'En colección oculta', price: 1, stock: 1, collection: hidden.id },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  it('encuentra un producto por slug con imágenes y colección pobladas', async () => {
    const product = await getProductBySlug('aretes-luna')
    expect(product?.name).toBe('Aretes Luna')
    expect(product?.price).toBe(42)
    expect(product?.stock).toBe(3)
    expect(product?.collection.title).toBe('Activa')
    const [image] = product?.images ?? []
    expect(typeof image === 'object' && image?.url).toBeTruthy()
  })

  it('devuelve null para slugs inexistentes (→ 404)', async () => {
    expect(await getProductBySlug('no-existe')).toBeNull()
  })

  it('devuelve null para productos inactivos', async () => {
    expect(await getProductBySlug('inactivo')).toBeNull()
  })

  it('devuelve null si la colección del producto está inactiva', async () => {
    expect(await getProductBySlug('en-coleccion-oculta')).toBeNull()
  })

  it('lista productos relacionados de la misma colección sin el actual ni inactivos', async () => {
    const product = (await getProductBySlug('aretes-luna'))!
    const related = await getRelatedProducts(product.collection.id, product.id)
    expect(related.map((p) => p.name).sort()).toEqual(['Anillo Mar', 'Collar Sol'])
  })

  it('toPlainText extrae y recorta la descripción para metadatos', async () => {
    const product = (await getProductBySlug('aretes-luna'))!
    expect(toPlainText(product.description)).toBe('Pieza hecha a mano. Ligera y resistente.')
    expect(toPlainText(product.description, 25)).toBe('Pieza hecha a mano.…')
    expect(toPlainText(null)).toBe('')
    expect(toPlainText('texto suelto')).toBe('')
  })
})
