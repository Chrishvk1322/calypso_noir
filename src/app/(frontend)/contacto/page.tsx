import { MailIcon, TruckIcon } from 'lucide-react'
import type { Metadata } from 'next'

import { WhatsAppIcon } from '@/components/shop/icons'
import { socialLinks } from '@/components/shop/socials'
import { Button } from '@/components/ui/button'
import { getSiteConfig } from '@/lib/site'
import { buildWhatsAppUrl, formatPhone, socialHandle } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escríbenos por WhatsApp, correo o redes sociales. Piezas hechas a mano en arcilla polimérica; enviamos a todo el Perú.',
}

const DEFAULT_CONTACT_MESSAGE = '¡Hola! Tengo una consulta sobre Calypso Noir.'

export default async function ContactPage() {
  const config = await getSiteConfig()

  const whatsappUrl = buildWhatsAppUrl(
    config.whatsappNumber,
    config.contactWhatsappMessage || DEFAULT_CONTACT_MESSAGE,
  )
  const customDesignUrl = buildWhatsAppUrl(config.whatsappNumber, config.customDesignWhatsappMessage)
  const socials = socialLinks(config)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-14 sm:px-6 sm:py-20">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-5xl sm:text-6xl">Contacto</h1>
        <p className="text-lg text-muted-foreground">
          ¿Tienes una consulta, quieres un diseño personalizado o hacer seguimiento a tu pedido? Escríbenos, te
          respondemos lo antes posible.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2" data-testid="contact-channels">
        {whatsappUrl && (
          <li className="flex flex-col gap-4 rounded-lg border bg-card p-6 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground">
                <WhatsAppIcon className="size-6" />
              </span>
              <div className="space-y-1">
                <h2 className="font-sans text-lg font-medium">WhatsApp</h2>
                <p className="text-muted-foreground tabular-nums">{formatPhone(config.whatsappNumber)}</p>
                <p className="text-sm text-muted-foreground">La forma más rápida de comunicarte con nosotros.</p>
              </div>
            </div>
            <Button asChild variant="whatsapp" size="lg" className="h-12 rounded-full px-6 text-base">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                Escribir por WhatsApp
              </a>
            </Button>
          </li>
        )}

        {config.contactEmail && (
          <li className="flex items-start gap-4 rounded-lg border bg-card p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary">
              <MailIcon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="font-sans text-lg font-medium">Correo</h2>
              <a
                href={`mailto:${config.contactEmail}`}
                className="break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {config.contactEmail}
              </a>
            </div>
          </li>
        )}

        <li className="flex items-start gap-4 rounded-lg border bg-card p-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary">
            <TruckIcon className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="font-sans text-lg font-medium">Envíos</h2>
            <p className="text-muted-foreground">Enviamos a todo el Perú. Coordinamos el envío por WhatsApp.</p>
          </div>
        </li>

        {socials.length > 0 && (
          <li className="flex flex-col gap-4 rounded-lg border bg-card p-6 sm:col-span-2">
            <h2 className="font-sans text-lg font-medium">Síguenos</h2>
            <ul className="flex flex-wrap gap-3">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full border px-4 transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Icon className="size-5" />
                    <span>{label}</span>
                    {socialHandle(href) && <span className="text-muted-foreground">{socialHandle(href)}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>

      {customDesignUrl && (
        <section className="flex flex-col items-center gap-4 rounded-lg bg-primary px-6 py-10 text-center text-primary-foreground">
          <h2 className="text-3xl sm:text-4xl">¿Deseas un diseño personalizado?</h2>
          <p className="max-w-xl text-primary-foreground/80">
            Cuéntanos tu idea: colores, formas o una ocasión especial. Creamos piezas únicas a tu medida.
          </p>
          <Button asChild variant="whatsapp" size="lg" className="mt-2 h-12 gap-2 rounded-full px-6 text-base">
            <a href={customDesignUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="size-5" />
              Pedir un diseño personalizado
            </a>
          </Button>
        </section>
      )}
    </div>
  )
}
