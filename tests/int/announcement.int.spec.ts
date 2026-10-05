import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'
import type { SiteConfig } from '@/payload-types'

let payload: Payload
let previous: Pick<SiteConfig, 'announcementEnabled' | 'announcementText' | 'announcementLink'>

const update = (data: Partial<SiteConfig>) => payload.updateGlobal({ slug: 'site-config', data })

describe('Mejora 8.4: barra de anuncio en SiteConfig', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    const site = await payload.findGlobal({ slug: 'site-config' })
    previous = {
      announcementEnabled: site.announcementEnabled,
      announcementText: site.announcementText,
      announcementLink: site.announcementLink,
    }
  })

  afterAll(async () => {
    await update({ ...previous, announcementEnabled: previous.announcementEnabled ?? false })
  })

  it('guarda una barra activa con texto y enlace', async () => {
    const site = await update({
      announcementEnabled: true,
      announcementText: 'Envío gratis en Lima',
      announcementLink: '/catalogo',
    })
    expect(site).toMatchObject({ announcementEnabled: true, announcementText: 'Envío gratis en Lima', announcementLink: '/catalogo' })
  })

  it('exige texto si la barra está activa', async () => {
    await expect(update({ announcementEnabled: true, announcementText: '  ' })).rejects.toThrow()
  })

  it('permite guardar sin texto si la barra está desactivada', async () => {
    const site = await update({ announcementEnabled: false, announcementText: '', announcementLink: '' })
    expect(site.announcementEnabled).toBe(false)
  })

  it('rechaza un texto de más de 100 caracteres y un enlace inválido', async () => {
    await expect(update({ announcementEnabled: true, announcementText: 'x'.repeat(101) })).rejects.toThrow()
    await expect(
      update({ announcementEnabled: true, announcementText: 'Hola', announcementLink: 'javascript:alert(1)' }),
    ).rejects.toThrow()
  })
})
