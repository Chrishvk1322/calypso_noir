import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { normalizeOriginal, ORIGINAL_MAX_SIDE, ORIGINAL_WEBP_QUALITY } from '@/hooks/media'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

// Todas las imágenes se optimizan localmente con sharp (configurado en payload.config.ts).
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Contenido',
  },
  hooks: {
    // Una imagen reemplazada o editada (alt, punto focal) afecta todo lo que la muestra.
    afterChange: [
      // Primero se corrige el archivo (recortes del admin) y luego se revalida lo que lo muestra.
      normalizeOriginal,
      revalidateAfterChange(['media', 'collections', 'products', 'hero-slides', 'site-config']),
    ],
    afterDelete: [revalidateAfterDelete(['media', 'collections', 'products', 'hero-slides', 'site-config'])],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    // El original se limita a 2000px y se recodifica en WebP. next/image lo vuelve a reducir al
    // tamaño de cada pantalla (la galería se muestra a ~1000px como mucho, 2000px cubre retina).
    resizeOptions: { width: ORIGINAL_MAX_SIDE, height: ORIGINAL_MAX_SIDE, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: ORIGINAL_WEBP_QUALITY } },
    adminThumbnail: 'thumbnail',
    // Sin tamaño "hero": el carrusel y la portada de colección usan el original con next/image.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        formatOptions: { format: 'webp', options: { quality: 75 } },
      },
      {
        name: 'card',
        width: 600,
        height: 750,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        // Las redes sociales no siempre aceptan WebP para OpenGraph.
        name: 'og',
        width: 1200,
        height: 630,
        formatOptions: { format: 'jpeg', options: { quality: 82 } },
      },
    ],
  },
}
