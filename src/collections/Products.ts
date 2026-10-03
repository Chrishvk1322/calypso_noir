import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrActive } from '@/access'
import { slugField } from '@/fields/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  access: {
    read: authenticatedOrActive,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'collection', 'price', 'stock', 'active'],
    group: 'Tienda',
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'name', type: 'text', label: 'Nombre', required: true },
    slugField('name'),
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          label: 'Precio (S/.)',
          required: true,
          min: 0,
        },
        {
          name: 'stock',
          type: 'number',
          label: 'Stock',
          required: true,
          defaultValue: 0,
          min: 0,
          // Un `validate` propio reemplaza la validación por defecto (incluido `min`).
          validate: (value: number | null | undefined) =>
            (typeof value === 'number' && Number.isInteger(value) && value >= 0) ||
            'El stock debe ser un número entero mayor o igual a 0.',
        },
      ],
    },
    { name: 'description', type: 'richText', label: 'Descripción' },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Imágenes',
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'collections',
      label: 'Colección',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Activo',
      defaultValue: true,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
}
