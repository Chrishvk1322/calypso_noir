import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrActive } from '@/access'
import { slugField } from '@/fields/slug'

export const Collections: CollectionConfig = {
  slug: 'collections',
  labels: { singular: 'Colección', plural: 'Colecciones' },
  access: {
    read: authenticatedOrActive,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'createdAt'],
    group: 'Tienda',
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'title', type: 'text', label: 'Título', required: true },
    slugField('title'),
    { name: 'description', type: 'textarea', label: 'Descripción' },
    { name: 'coverImage', type: 'upload', relationTo: 'media', label: 'Imagen de portada' },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activa',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
}
