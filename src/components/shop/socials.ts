import type { SiteConfig } from '@/payload-types'

import { InstagramIcon, PinterestIcon, TikTokIcon } from './icons'

/** Redes con URL configurada en el admin, en el orden en que se muestran (footer y /contacto). */
export const socialLinks = (config: Pick<SiteConfig, 'instagramUrl' | 'tiktokUrl' | 'pinterestUrl'>) =>
  [
    { href: config.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { href: config.tiktokUrl, label: 'TikTok', Icon: TikTokIcon },
    { href: config.pinterestUrl, label: 'Pinterest', Icon: PinterestIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))
