import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'Configuración del sitio',
  access: {
    read: anyone,
    update: authenticated,
  },
  admin: {
    group: 'Contenido',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contacto y WhatsApp',
          fields: [
            { name: 'contactEmail', type: 'email', label: 'Correo de contacto' },
            {
              name: 'whatsappNumber',
              type: 'text',
              label: 'Número de WhatsApp',
              admin: {
                description: 'Con código de país, sin espacios ni "+". Ej: 51987654321',
              },
              validate: (value: string | null | undefined) =>
                !value ||
                /^\d{8,15}$/.test(value) ||
                'Solo dígitos, con código de país (ej: 51987654321).',
            },
            {
              name: 'whatsappMessageTemplate',
              type: 'textarea',
              label: 'Plantilla del mensaje de pedido',
              defaultValue:
                '¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago.',
              admin: {
                description:
                  'Variables: {orderCode} (código), {totalAmount} (total), {customerName} (nombre del cliente) y {items} (lista de productos).',
              },
            },
            {
              name: 'customDesignWhatsappMessage',
              type: 'textarea',
              label: 'Mensaje para diseños personalizados',
              defaultValue: '¡Hola! Me gustaría pedir un diseño personalizado.',
            },
          ],
        },
        {
          label: 'Redes sociales',
          fields: [
            { name: 'tiktokUrl', type: 'text', label: 'URL de TikTok' },
            { name: 'instagramUrl', type: 'text', label: 'URL de Instagram' },
          ],
        },
        {
          label: 'Sobre mí',
          fields: [
            { name: 'aboutUsText', type: 'richText', label: 'Texto "Sobre mí"' },
            {
              name: 'aboutUsPhotos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Fotos',
            },
          ],
        },
      ],
    },
  ],
}
