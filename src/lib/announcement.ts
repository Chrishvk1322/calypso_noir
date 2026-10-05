import type { SiteConfig } from '@/payload-types'

// ~100 caracteres caben en una línea en escritorio y en dos como máximo en móvil (franja fina).
export const ANNOUNCEMENT_MAX_LENGTH = 100

/** Ruta interna ("/catalogo", sin "//") o dirección http(s) completa. */
export const isValidAnnouncementLink = (value: string) => {
  const link = value.trim()
  if (link.startsWith('/')) return !link.startsWith('//')
  try {
    const { protocol } = new URL(link)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export type Announcement = { text: string; href: string | null; external: boolean }

/** Anuncio a mostrar, o `null` si la barra está desactivada o sin texto. */
export const getAnnouncement = (
  config: Pick<SiteConfig, 'announcementEnabled' | 'announcementText' | 'announcementLink'>,
): Announcement | null => {
  const text = config.announcementText?.trim()
  if (!config.announcementEnabled || !text) return null

  const link = config.announcementLink?.trim()
  const href = link && isValidAnnouncementLink(link) ? link : null
  return { text, href, external: Boolean(href && !href.startsWith('/')) }
}
