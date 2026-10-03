import { MailIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getSiteConfig } from '@/lib/site'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

import { InstagramIcon, TikTokIcon, WhatsAppIcon } from './icons'

export async function Footer() {
  const config = await getSiteConfig()
  const customDesignUrl = buildWhatsAppUrl(config.whatsappNumber, config.customDesignWhatsappMessage)

  const socials = [
    { href: config.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { href: config.tiktokUrl, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href))

  return (
    <footer className="mt-auto border-t bg-secondary/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-4">
          <p className="font-heading text-3xl">Enviamos a todo el Perú</p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            {config.contactEmail && (
              <a
                href={`mailto:${config.contactEmail}`}
                className="inline-flex items-center gap-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <MailIcon className="size-4" aria-hidden />
                {config.contactEmail}
              </a>
            )}

            {socials.length > 0 && (
              <ul className="flex items-center gap-2" aria-label="Redes sociales">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {customDesignUrl && (
          <Button asChild variant="whatsapp" size="lg" className="h-12 gap-2 rounded-full px-6 text-base">
            <a href={customDesignUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5" />
              ¿Deseas un diseño personalizado?
            </a>
          </Button>
        )}
      </div>

      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Calypso Noir. Piezas hechas a mano en arcilla polimérica.
        </p>
      </div>
    </footer>
  )
}
