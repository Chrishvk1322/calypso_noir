import type { Media } from '@/payload-types'

export type ImageSize = keyof NonNullable<Media['sizes']>

export type ImageData = {
  url: string
  alt: string
  width: number
  height: number
}

/** Payload devuelve URLs absolutas (serverURL); next/image trabaja con rutas locales. */
const toPath = (url: string) => {
  try {
    return new URL(url, 'http://local').pathname
  } catch {
    return url
  }
}

/**
 * Datos de una imagen en el tamaño pedido. Si el tamaño no existe (Payload no amplía
 * imágenes más pequeñas que el tamaño configurado) usa el original.
 */
export const getImage = (
  media: number | Media | null | undefined,
  size?: ImageSize,
): ImageData | null => {
  if (!media || typeof media === 'number') return null

  // `?v=` cambia cuando se reemplaza la imagen, para que el optimizador de Next no sirva
  // una versión vieja si el archivo nuevo conserva el mismo nombre.
  const version = `?v=${new Date(media.updatedAt).getTime()}`

  const variant = size ? media.sizes?.[size] : undefined
  if (variant?.url && variant.width && variant.height) {
    return { url: toPath(variant.url) + version, alt: media.alt, width: variant.width, height: variant.height }
  }
  if (media.url && media.width && media.height) {
    return { url: toPath(media.url) + version, alt: media.alt, width: media.width, height: media.height }
  }
  return null
}
