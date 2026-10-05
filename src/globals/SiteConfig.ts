import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'
import { ANNOUNCEMENT_MAX_LENGTH, isValidAnnouncementLink } from '@/lib/announcement'
import type { SiteConfig as SiteConfigType } from '@/payload-types'

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
  hooks: {
    afterChange: [revalidateGlobalAfterChange(['site-config'])],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Barra de anuncio',
          description: 'Franja fina encima del carrusel de la página principal.',
          fields: [
            {
              name: 'announcementEnabled',
              type: 'checkbox',
              label: 'Mostrar barra de anuncio',
              defaultValue: false,
            },
            {
              name: 'announcementText',
              type: 'text',
              label: 'Texto del anuncio',
              maxLength: ANNOUNCEMENT_MAX_LENGTH,
              admin: {
                description: `Máximo ${ANNOUNCEMENT_MAX_LENGTH} caracteres. Mientras más corto, más fina la franja: hasta ~45 caracteres se ve en una sola línea en celulares. Ej: Envío gratis en Lima desde S/. 100`,
              },
              // Un `validate` propio reemplaza la validación por defecto (incluido `maxLength`).
              validate: (value: string | null | undefined, { siblingData }: { siblingData: Partial<SiteConfigType> }) => {
                const text = value?.trim() ?? ''
                if (siblingData.announcementEnabled && !text) return 'Escribe el texto o desactiva la barra.'
                if (text.length > ANNOUNCEMENT_MAX_LENGTH) return `Máximo ${ANNOUNCEMENT_MAX_LENGTH} caracteres.`
                return true
              },
            },
            {
              name: 'announcementLink',
              type: 'text',
              label: 'Enlace (opcional)',
              admin: {
                description: 'Página de la tienda (ej: /catalogo o /colecciones/verano-citrico) o dirección completa (https://…).',
              },
              validate: (value: string | null | undefined) =>
                !value?.trim() || isValidAnnouncementLink(value) || 'Usa una ruta que empiece con "/" o una dirección https://…',
            },
          ],
        },
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
              name: 'contactWhatsappMessage',
              type: 'textarea',
              label: 'Mensaje para consultas (página de Contacto)',
              defaultValue: '¡Hola! Tengo una consulta sobre Calypso Noir.',
            },
            {
              name: 'receiptMessage',
              type: 'textarea',
              label: 'Mensaje en la boleta de compra',
              defaultValue:
                '¡Gracias por tu compra! Cada pieza fue modelada a mano con mucho cariño. Si tienes alguna consulta sobre tu pedido, escríbenos por WhatsApp.',
              admin: { description: 'Aparece al pie de la boleta PDF que se emite para cada pedido finalizado.' },
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
            { name: 'pinterestUrl', type: 'text', label: 'URL de Pinterest' },
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
