import { describe, expect, it } from 'vitest'

import { getAnnouncement, isValidAnnouncementLink } from '@/lib/announcement'

describe('isValidAnnouncementLink', () => {
  it('acepta rutas internas y direcciones http(s)', () => {
    expect(isValidAnnouncementLink('/catalogo')).toBe(true)
    expect(isValidAnnouncementLink('/colecciones/verano-citrico?page=2')).toBe(true)
    expect(isValidAnnouncementLink('https://instagram.com/calypsonoir')).toBe(true)
    expect(isValidAnnouncementLink('  /catalogo  ')).toBe(true)
  })

  it('rechaza rutas sin "/", URLs de protocolo relativo y otros esquemas', () => {
    expect(isValidAnnouncementLink('catalogo')).toBe(false)
    expect(isValidAnnouncementLink('//evil.example')).toBe(false)
    expect(isValidAnnouncementLink('javascript:alert(1)')).toBe(false)
    expect(isValidAnnouncementLink('mailto:hola@calypsonoir.pe')).toBe(false)
  })
})

describe('getAnnouncement', () => {
  it('devuelve null si está desactivada o sin texto', () => {
    expect(getAnnouncement({ announcementEnabled: false, announcementText: 'Hola' })).toBeNull()
    expect(getAnnouncement({ announcementEnabled: true, announcementText: '   ' })).toBeNull()
    expect(getAnnouncement({ announcementEnabled: null, announcementText: 'Hola' })).toBeNull()
  })

  it('devuelve el texto sin espacios sobrantes y sin enlace', () => {
    expect(getAnnouncement({ announcementEnabled: true, announcementText: '  Envío gratis  ' })).toEqual({
      text: 'Envío gratis',
      href: null,
      external: false,
    })
  })

  it('distingue enlaces internos y externos, e ignora los inválidos', () => {
    const base = { announcementEnabled: true, announcementText: 'Nueva colección' }
    expect(getAnnouncement({ ...base, announcementLink: '/catalogo' })).toMatchObject({ href: '/catalogo', external: false })
    expect(getAnnouncement({ ...base, announcementLink: 'https://wa.me/51' })).toMatchObject({
      href: 'https://wa.me/51',
      external: true,
    })
    expect(getAnnouncement({ ...base, announcementLink: 'javascript:alert(1)' })).toMatchObject({ href: null })
  })
})
