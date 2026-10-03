import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { getPayloadClient } from '@/lib/payload'
import { getSitemapEntries } from '@/lib/queries'
import { SITE_URL } from '@/lib/site-url'

let payload: Payload

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

describe('Fase 7: revalidación, sitemap y robots', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    const visible = await payload.create({ collection: 'collections', data: { title: 'Visible' } })
    const hidden = await payload.create({ collection: 'collections', data: { title: 'Oculta', active: false } })
    await payload.create({ collection: 'products', data: { name: 'Aretes Uno', price: 10, stock: 1, collection: visible.id } })
    await payload.create({
      collection: 'products',
      data: { name: 'Inactivo', price: 10, stock: 1, collection: visible.id, active: false },
    })
    await payload.create({
      collection: 'products',
      data: { name: 'De colección oculta', price: 10, stock: 1, collection: hidden.id },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('Hooks de revalidación', () => {
    it('crear, editar y borrar con hooks de revalidación no rompe la escritura', async () => {
      const collection = await payload.create({ collection: 'collections', data: { title: 'Temporal' } })
      const product = await payload.create({
        collection: 'products',
        data: { name: 'Temporal', price: 1, stock: 1, collection: collection.id },
      })
      const updated = await payload.update({ collection: 'products', id: product.id, data: { price: 2 } })
      expect(updated.price).toBe(2)
      await payload.delete({ collection: 'products', id: product.id })
      await payload.delete({ collection: 'collections', id: collection.id })

      const before = await payload.findGlobal({ slug: 'site-config' })
      const site = await payload.updateGlobal({ slug: 'site-config', data: { contactEmail: 'prueba@calypsonoir.pe' } })
      expect(site.contactEmail).toBe('prueba@calypsonoir.pe')
      await payload.updateGlobal({ slug: 'site-config', data: { contactEmail: before.contactEmail ?? '' } })
    })
  })

  describe('Sitemap', () => {
    it('lista solo colecciones y productos públicos', async () => {
      const { collections, products } = await getSitemapEntries()
      expect(collections.map((c) => c.slug)).toEqual(['visible'])
      expect(products.map((p) => p.slug)).toEqual(['aretes-uno'])
    })

    it('genera URLs absolutas de páginas fijas, colecciones y productos', async () => {
      const urls = (await sitemap()).map((entry) => entry.url)
      expect(urls).toEqual([
        `${SITE_URL}/`,
        `${SITE_URL}/catalogo`,
        `${SITE_URL}/sobre-mi`,
        `${SITE_URL}/contacto`,
        `${SITE_URL}/colecciones/visible`,
        `${SITE_URL}/productos/aretes-uno`,
      ])
    })
  })

  describe('Robots', () => {
    it('bloquea el admin y la API e indica el sitemap', () => {
      const result = robots()
      expect(result.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] })
      expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    })
  })
})
