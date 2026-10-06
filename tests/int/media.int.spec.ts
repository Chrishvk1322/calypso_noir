import fs from 'fs/promises'
import type { Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { mediaFilePath, ORIGINAL_MAX_SIDE } from '@/hooks/media'
import { getPayloadClient } from '@/lib/payload'
import type { Media } from '@/payload-types'

let payload: Payload
let collectionId: number
let aboutUsPhotosBefore: number[]

const cleanDatabase = async () => {
  for (const slug of ['products', 'collections', 'hero-slides', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#7a5c4f' } }).jpeg().toBuffer()

const upload = async (name: string, width = 800, height = 600, req?: Parameters<Payload['create']>[0]['req']) => {
  const data = await photo(width, height)
  return payload.create({
    collection: 'media',
    data: { alt: name },
    file: { data, mimetype: 'image/jpeg', name: `${name}.jpg`, size: data.length },
    req,
  })
}

const fileExists = (filename: string) =>
  fs.access(mediaFilePath(payload, filename)).then(() => true, () => false)

const mediaExists = async (id: number) =>
  (await payload.count({ collection: 'media', where: { id: { equals: id } } })).totalDocs === 1

describe('Optimización de imágenes', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()
    collectionId = (await payload.create({ collection: 'collections', data: { title: 'Imágenes QA' } })).id
    const config = await payload.findGlobal({ slug: 'site-config', depth: 0 })
    aboutUsPhotosBefore = (config.aboutUsPhotos ?? []).map((p) => (typeof p === 'object' ? p.id : p))
  })

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'site-config', data: { aboutUsPhotos: aboutUsPhotosBefore } })
    await cleanDatabase()
  })

  describe('al subir', () => {
    it('reduce el original a 2000px en WebP y no genera el tamaño "hero"', async () => {
      const media = await upload('grande', 3000, 2000)
      expect(media.mimeType).toBe('image/webp')
      expect(Math.max(media.width!, media.height!)).toBe(ORIGINAL_MAX_SIDE)
      expect(Object.keys(media.sizes ?? {}).sort()).toEqual(['card', 'og', 'thumbnail'])

      const onDisk = await sharp(mediaFilePath(payload, media.filename!)).metadata()
      expect(onDisk.format).toBe('webp')
      expect(onDisk.width).toBe(2000)
    })
  })

  describe('al recortar en el admin', () => {
    // Payload guarda el recorte sin convertirlo ni reducirlo; el hook normalizeOriginal lo corrige.
    const cropReq = (width: number, height: number) =>
      ({
        query: {
          uploadEdits: {
            crop: { x: 0, y: 0, width: 100, height: 100, unit: '%' },
            focalPoint: { x: 50, y: 50 },
            widthInPixels: width,
            heightInPixels: height,
          },
        },
      }) as never

    const expectWebpOnDisk = async (media: Media, maxSide: number) => {
      const onDisk = await sharp(mediaFilePath(payload, media.filename!)).metadata()
      expect(onDisk.format).toBe('webp')
      expect(Math.max(onDisk.width!, onDisk.height!)).toBeLessThanOrEqual(maxSide)
      expect(media.mimeType).toBe('image/webp')
      expect(media.width).toBe(onDisk.width)
      expect(media.height).toBe(onDisk.height)
      const stat = await fs.stat(mediaFilePath(payload, media.filename!))
      expect(media.filesize).toBe(stat.size)
    }

    it('un recorte pequeño queda en WebP', async () => {
      const media = await upload('recorte', 1200, 900, cropReq(900, 720))
      expect(media.width).toBe(900)
      expect(media.height).toBe(720)
      await expectWebpOnDisk(media, 900)
    })

    it('un recorte de una foto grande también se reduce a 2000px', async () => {
      const media = await upload('recorte-grande', 4000, 3000, cropReq(3600, 2700))
      expect(Math.max(media.width!, media.height!)).toBe(ORIGINAL_MAX_SIDE)
      await expectWebpOnDisk(media, ORIGINAL_MAX_SIDE)
    })

    it('editar solo el texto alternativo no vuelve a procesar el archivo', async () => {
      const media = await upload('sin-cambios', 1000, 800)
      const before = await fs.stat(mediaFilePath(payload, media.filename!))
      const updated = await payload.update({ collection: 'media', id: media.id, data: { alt: 'Otro texto' } })
      const after = await fs.stat(mediaFilePath(payload, media.filename!))
      expect(updated.filesize).toBe(media.filesize)
      expect(after.mtimeMs).toBe(before.mtimeMs)
    })
  })

  describe('al borrar un producto', () => {
    it('borra sus imágenes que nada más usa y conserva las compartidas', async () => {
      const [own, shared, cover, slide, about] = await Promise.all(
        ['propia', 'compartida', 'portada', 'slide', 'sobre-mi'].map((name) => upload(name)),
      )
      const product = await payload.create({
        collection: 'products',
        data: {
          name: 'Producto a borrar',
          price: 20,
          stock: 1,
          collection: collectionId,
          images: [own.id, shared.id, cover.id, slide.id, about.id],
        },
      })
      await payload.create({
        collection: 'products',
        data: { name: 'Otro producto', price: 20, stock: 1, collection: collectionId, images: [shared.id] },
      })
      await payload.update({ collection: 'collections', id: collectionId, data: { coverImage: cover.id } })
      await payload.create({ collection: 'hero-slides', data: { title: 'Slide', image: slide.id, order: 1 } })
      await payload.updateGlobal({ slug: 'site-config', data: { aboutUsPhotos: [...aboutUsPhotosBefore, about.id] } })

      await payload.delete({ collection: 'products', id: product.id })

      expect(await mediaExists(own.id)).toBe(false)
      expect(await fileExists(own.filename!)).toBe(false)
      for (const size of Object.values(own.sizes ?? {})) {
        if (size?.filename) expect(await fileExists(size.filename)).toBe(false)
      }
      for (const kept of [shared, cover, slide, about]) {
        expect(await mediaExists(kept.id), kept.alt).toBe(true)
        expect(await fileExists(kept.filename!), kept.alt).toBe(true)
      }
    })

    it('el borrado masivo también limpia las imágenes', async () => {
      const [a, b] = await Promise.all([upload('masivo-a'), upload('masivo-b')])
      for (const image of [a, b]) {
        await payload.create({
          collection: 'products',
          data: { name: `Masivo ${image.alt}`, price: 10, stock: 1, collection: collectionId, images: [image.id] },
        })
      }
      await payload.delete({ collection: 'products', where: { name: { like: 'Masivo' } } })
      expect(await mediaExists(a.id)).toBe(false)
      expect(await mediaExists(b.id)).toBe(false)
    })
  })
})
