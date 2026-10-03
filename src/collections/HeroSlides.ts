import { APIError, type CollectionBeforeValidateHook, type CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const MAX_HERO_SLIDES = 3

const limitSlides: CollectionBeforeValidateHook = async ({ operation, req }) => {
  if (operation !== 'create') return
  const { totalDocs } = await req.payload.count({ collection: 'hero-slides', req })
  if (totalDocs >= MAX_HERO_SLIDES) {
    throw new APIError(
      `El carrusel admite como máximo ${MAX_HERO_SLIDES} slides. Edita o elimina uno existente.`,
      400,
      undefined,
      true,
    )
  }
}

export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  labels: { singular: 'Slide del carrusel', plural: 'Carrusel (Home)' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'collectionLink', 'order'],
    description: `Hasta ${MAX_HERO_SLIDES} slides. Se muestran ordenados por el campo "Orden".`,
    group: 'Contenido',
  },
  defaultSort: 'order',
  hooks: {
    beforeValidate: [limitSlides],
    afterChange: [revalidateAfterChange(['hero-slides'])],
    afterDelete: [revalidateAfterDelete(['hero-slides'])],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Título' },
    { name: 'subtitle', type: 'text', label: 'Subtítulo' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Imagen' },
    {
      name: 'collectionLink',
      type: 'relationship',
      relationTo: 'collections',
      label: 'Colección enlazada ("Ver colección")',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Orden',
      defaultValue: 1,
      admin: { position: 'sidebar' },
    },
  ],
}
