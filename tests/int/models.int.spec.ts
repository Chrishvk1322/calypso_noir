import type { Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'
import type { Collection, Media } from '@/payload-types'

let payload: Payload
let media: Media
let collection: Collection

// Elimina todo lo que crean las pruebas. Corre al inicio (por si quedó basura) y al final.
const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

describe('Modelos del CMS', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    // Imagen grande generada al vuelo: Payload no amplía imágenes más pequeñas que un tamaño.
    const data = await sharp({
      create: { width: 2000, height: 1500, channels: 3, background: '#7a5c4f' },
    })
      .jpeg()
      .toBuffer()
    media = await payload.create({
      collection: 'media',
      data: { alt: 'Imagen de prueba' },
      file: { data, mimetype: 'image/jpeg', name: 'prueba.jpg', size: data.length },
    })
    collection = await payload.create({
      collection: 'collections',
      data: { title: 'Colección Otoño' },
    })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('Collections', () => {
    it('autogenera el slug y aplica active=true por defecto', () => {
      expect(collection.slug).toBe('coleccion-otono')
      expect(collection.active).toBe(true)
    })

    it('vuelve único un slug repetido', async () => {
      const dup = await payload.create({
        collection: 'collections',
        data: { title: 'Colección Otoño' },
      })
      expect(dup.slug).toBe('coleccion-otono-2')
    })

    it('respeta un slug escrito a mano (normalizado)', async () => {
      const custom = await payload.create({
        collection: 'collections',
        data: { title: 'Primavera', slug: 'Mi Slug Propio' },
      })
      expect(custom.slug).toBe('mi-slug-propio')
    })

    it('no cambia el slug al editar otros campos', async () => {
      const updated = await payload.update({
        collection: 'collections',
        id: collection.id,
        data: { description: 'Nueva descripción' },
      })
      expect(updated.slug).toBe('coleccion-otono')
    })

    it('exige title', async () => {
      await expect(
        payload.create({ collection: 'collections', data: {} as never }),
      ).rejects.toThrow()
    })
  })

  describe('Products', () => {
    it('crea un producto con defaults stock=0 y active=true', async () => {
      const product = await payload.create({
        collection: 'products',
        // Sin stock a propósito: se prueba el valor por defecto.
        data: { name: 'Aretes Luna', price: 35, collection: collection.id, images: [media.id] } as never,
      })
      expect(product.slug).toBe('aretes-luna')
      expect(product.stock).toBe(0)
      expect(product.active).toBe(true)
    })

    it('exige price y collection', async () => {
      await expect(
        payload.create({
          collection: 'products',
          data: { name: 'Sin precio', collection: collection.id } as never,
        }),
      ).rejects.toThrow()
      await expect(
        payload.create({ collection: 'products', data: { name: 'Sin colección', price: 10 } as never }),
      ).rejects.toThrow()
    })

    it('rechaza stock negativo o decimal', async () => {
      for (const stock of [-1, 1.5]) {
        await expect(
          payload.create({
            collection: 'products',
            data: { name: 'Stock inválido', price: 10, stock, collection: collection.id },
          }),
        ).rejects.toThrow()
      }
    })
  })

  describe('Orders', () => {
    const customer = { customerName: 'Ana Pérez', customerPhone: '987654321' }

    it('crea un pedido válido con estado pending por defecto', async () => {
      const product = await payload.create({
        collection: 'products',
        data: { name: 'Collar Sol', price: 50, stock: 5, collection: collection.id },
      })
      const order = await payload.create({
        collection: 'orders',
        // Sin status a propósito: se prueba el valor por defecto.
        data: {
          ...customer,
          orderCode: '#PED-1234',
          items: [{ product: product.id, quantity: 2, unitPrice: 50 }],
        } as never,
      })
      expect(order.status).toBe('pending')
    })

    it('rechaza orderCode repetido o con formato inválido', async () => {
      const product = await payload.find({ collection: 'products', limit: 1 })
      const items = [{ product: product.docs[0].id, quantity: 1, unitPrice: 10 }]
      await expect(
        payload.create({
          collection: 'orders',
          data: { ...customer, orderCode: '#PED-1234', status: 'pending', items },
        }),
      ).rejects.toThrow()
      await expect(
        payload.create({ collection: 'orders', data: { ...customer, orderCode: 'PED1', status: 'pending', items } }),
      ).rejects.toThrow()
    })

    it('exige al menos un ítem', async () => {
      await expect(
        payload.create({
          collection: 'orders',
          data: { ...customer, status: 'pending', items: [] },
        }),
      ).rejects.toThrow()
    })

    it('exige nombre y teléfono del cliente', async () => {
      const product = await payload.find({ collection: 'products', limit: 1 })
      const items = [{ product: product.docs[0].id, quantity: 1, unitPrice: 10 }]
      await expect(
        payload.create({ collection: 'orders', data: { customerPhone: '987654321', status: 'pending', items } as never }),
      ).rejects.toThrow()
      await expect(
        payload.create({ collection: 'orders', data: { customerName: 'Ana', status: 'pending', items } as never }),
      ).rejects.toThrow()
      await expect(
        payload.create({ collection: 'orders', data: { customerName: 'Ana', customerPhone: '123', status: 'pending', items } }),
      ).rejects.toThrow()
    })
  })

  describe('HeroSlides', () => {
    it('permite hasta 3 slides y rechaza el 4.º', async () => {
      for (const order of [1, 2, 3]) {
        await payload.create({
          collection: 'hero-slides',
          data: { title: `Slide ${order}`, order, image: media.id, collectionLink: collection.id },
        })
      }
      await expect(
        payload.create({ collection: 'hero-slides', data: { title: 'Slide 4', order: 4 } }),
      ).rejects.toThrow(/máximo 3/)
    })

    it('permite editar un slide existente cuando ya hay 3', async () => {
      const { docs } = await payload.find({ collection: 'hero-slides', limit: 1 })
      const updated = await payload.update({
        collection: 'hero-slides',
        id: docs[0].id,
        data: { subtitle: 'Editado' },
      })
      expect(updated.subtitle).toBe('Editado')
    })
  })

  describe('SiteConfig', () => {
    it('trae las plantillas de WhatsApp por defecto', async () => {
      const config = await payload.findGlobal({ slug: 'site-config' })
      expect(config.whatsappMessageTemplate).toContain('{orderCode}')
      expect(config.whatsappMessageTemplate).toContain('{totalAmount}')
      expect(config.customDesignWhatsappMessage).toBeTruthy()
    })

    it('valida el número de WhatsApp', async () => {
      await expect(
        payload.updateGlobal({ slug: 'site-config', data: { whatsappNumber: '+51 987 654 321' } }),
      ).rejects.toThrow()
      const ok = await payload.updateGlobal({
        slug: 'site-config',
        data: { whatsappNumber: '51987654321' },
      })
      expect(ok.whatsappNumber).toBe('51987654321')
    })
  })

  describe('Control de acceso (público, sin usuario)', () => {
    it('solo ve colecciones y productos activos', async () => {
      const hidden = await payload.create({
        collection: 'collections',
        data: { title: 'Colección oculta', active: false },
      })
      await payload.create({
        collection: 'products',
        data: { name: 'Producto oculto', price: 1, stock: 1, collection: collection.id, active: false },
      })

      const publicCollections = await payload.find({
        collection: 'collections',
        overrideAccess: false,
        limit: 100,
      })
      expect(publicCollections.docs.some((c) => c.id === hidden.id)).toBe(false)
      expect(publicCollections.docs.every((c) => c.active)).toBe(true)

      const publicProducts = await payload.find({
        collection: 'products',
        overrideAccess: false,
        limit: 100,
      })
      expect(publicProducts.docs.length).toBeGreaterThan(0)
      expect(publicProducts.docs.every((p) => p.active)).toBe(true)
    })

    it('no puede leer pedidos', async () => {
      await expect(payload.find({ collection: 'orders', overrideAccess: false })).rejects.toThrow()
    })

    it('no puede crear productos ni editar la configuración', async () => {
      await expect(
        payload.create({
          collection: 'products',
          overrideAccess: false,
          data: { name: 'Hack', price: 1, stock: 1, collection: collection.id },
        }),
      ).rejects.toThrow()
      await expect(
        payload.updateGlobal({
          slug: 'site-config',
          overrideAccess: false,
          data: { contactEmail: 'hack@example.com' },
        }),
      ).rejects.toThrow()
    })

    it('sí puede leer slides, imágenes y configuración', async () => {
      const slides = await payload.find({ collection: 'hero-slides', overrideAccess: false })
      const images = await payload.find({ collection: 'media', overrideAccess: false })
      const config = await payload.findGlobal({ slug: 'site-config', overrideAccess: false })
      expect(slides.totalDocs).toBe(3)
      expect(images.totalDocs).toBeGreaterThan(0)
      expect(config).toBeDefined()
    })
  })

  describe('Media (sharp)', () => {
    it('convierte el original a WebP y genera todos los tamaños', () => {
      expect(media.mimeType).toBe('image/webp')
      for (const size of ['thumbnail', 'card', 'og'] as const) {
        expect(media.sizes?.[size]?.url, `tamaño ${size}`).toBeTruthy()
      }
      expect(media.sizes?.og?.mimeType).toBe('image/jpeg')
      expect(media.sizes?.og?.width).toBe(1200)
      expect(media.sizes?.og?.height).toBe(630)
    })
  })
})
