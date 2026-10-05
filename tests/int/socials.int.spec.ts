import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { socialLinks } from '@/components/shop/socials'
import { getPayloadClient } from '@/lib/payload'

let payload: Payload
let previous: string | null | undefined

describe('Mejora 8.3: Pinterest en las redes sociales', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    previous = (await payload.findGlobal({ slug: 'site-config' })).pinterestUrl
  })

  afterAll(async () => {
    await payload.updateGlobal({ slug: 'site-config', data: { pinterestUrl: previous ?? null } })
  })

  it('SiteConfig guarda la URL de Pinterest', async () => {
    const url = 'https://pe.pinterest.com/calypsonoir/'
    const site = await payload.updateGlobal({ slug: 'site-config', data: { pinterestUrl: url } })
    expect(site.pinterestUrl).toBe(url)
  })

  it('lista solo las redes con URL, en orden Instagram, TikTok, Pinterest', () => {
    const all = socialLinks({
      instagramUrl: 'https://instagram.com/a',
      tiktokUrl: 'https://tiktok.com/@a',
      pinterestUrl: 'https://pinterest.com/a',
    })
    expect(all.map(({ label }) => label)).toEqual(['Instagram', 'TikTok', 'Pinterest'])

    const onlyPinterest = socialLinks({ instagramUrl: '', tiktokUrl: null, pinterestUrl: 'https://pinterest.com/a' })
    expect(onlyPinterest).toHaveLength(1)
    expect(onlyPinterest[0]).toMatchObject({ label: 'Pinterest', href: 'https://pinterest.com/a' })
  })
})
