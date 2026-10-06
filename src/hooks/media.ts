import fs from 'fs/promises'
import path from 'path'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload, PayloadRequest } from 'payload'
import sharp from 'sharp'

import type { Media, Product } from '@/payload-types'

/** Lado máximo y calidad del original guardado (la tienda lo muestra a ~1000px como mucho). */
export const ORIGINAL_MAX_SIDE = 2000
export const ORIGINAL_WEBP_QUALITY = 80

/** Formatos que se recodifican; GIF/SVG (animaciones, vectores) se dejan tal cual. */
const RASTER_FORMATS = new Set(['jpeg', 'png', 'webp', 'tiff', 'avif', 'heif'])

type NormalizeResult = Pick<Media, 'filesize' | 'width' | 'height' | 'mimeType'>

/**
 * Deja el archivo original en WebP y dentro de ORIGINAL_MAX_SIDE. Payload ya lo hace al subir,
 * pero si la imagen se recorta en el admin guarda el recorte sin convertir ni reducir (JPEG de
 * varios MB con extensión .webp). Devuelve los datos nuevos o null si no hubo que tocarlo.
 * `onlyWrongFormat` evita recomprimir un WebP ya existente (cada pasada pierde algo de calidad).
 */
export const normalizeOriginalFile = async (
  file: string,
  { onlyWrongFormat = false } = {},
): Promise<NormalizeResult | null> => {
  const input = await fs.readFile(file)
  const meta = await sharp(input).metadata()
  if (!meta.format || !RASTER_FORMATS.has(meta.format)) return null

  const wrongFormat = meta.format !== 'webp'
  const tooBig = Math.max(meta.width ?? 0, meta.height ?? 0) > ORIGINAL_MAX_SIDE
  if (!wrongFormat && (onlyWrongFormat || !tooBig)) return null

  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: ORIGINAL_MAX_SIDE, height: ORIGINAL_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: ORIGINAL_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })
  await fs.writeFile(file, data)
  return { filesize: info.size, width: info.width, height: info.height, mimeType: 'image/webp' }
}

/** Ruta en disco del original de una imagen. */
export const mediaFilePath = (payload: Payload, filename: string) =>
  path.resolve(payload.collections.media.config.upload.staticDir ?? 'media', filename)

/** Corrige el original tras subir o recortar una imagen (ver normalizeOriginalFile). */
export const normalizeOriginal: CollectionAfterChangeHook<Media> = async ({ doc, req }) => {
  // Solo si en este guardado llegó un archivo (subida o recorte), no al editar el texto alternativo.
  if (!req.file || !doc.filename) return doc

  const fixed = await normalizeOriginalFile(mediaFilePath(req.payload, doc.filename))
  if (!fixed) return doc

  await req.payload.db.updateOne({ collection: 'media', id: doc.id, data: fixed, req })
  return { ...doc, ...fixed }
}

/** ¿Alguna otra parte de la tienda sigue usando esta imagen? */
export const isMediaInUse = async (payload: Payload, id: number, req?: PayloadRequest) => {
  // En serie: dentro de una transacción todas las consultas comparten la misma conexión.
  const checks = [
    () => payload.count({ collection: 'products', where: { images: { in: [id] } }, req }),
    () => payload.count({ collection: 'collections', where: { coverImage: { equals: id } }, req }),
    () => payload.count({ collection: 'hero-slides', where: { image: { equals: id } }, req }),
  ]
  for (const check of checks) {
    if ((await check()).totalDocs > 0) return true
  }

  const config = await payload.findGlobal({ slug: 'site-config', depth: 0, req })
  return (config.aboutUsPhotos ?? []).some((photo) => (typeof photo === 'object' ? photo.id : photo) === id)
}

/**
 * Al borrar un producto, borra sus imágenes (registro y archivos) si nada más las usa: otro
 * producto (p. ej. uno duplicado), una portada de colección, un slide o las fotos de "Sobre mí".
 * Un fallo aquí no impide borrar el producto: la imagen solo queda sin usar.
 */
export const deleteOrphanImages: CollectionAfterDeleteHook<Product> = async ({ doc, req }) => {
  const ids = new Set((doc.images ?? []).map((image) => (typeof image === 'object' ? image.id : image)))

  for (const id of ids) {
    try {
      if (await isMediaInUse(req.payload, id, req)) continue
      await req.payload.delete({ collection: 'media', id, req })
    } catch (error) {
      req.payload.logger.error({ err: error, msg: `No se pudo borrar la imagen ${id} del producto ${doc.id}` })
    }
  }
}
