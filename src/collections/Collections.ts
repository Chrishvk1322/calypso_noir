import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrActive } from '@/access'
import { slugField } from '@/fields/slug'
import { placeCollectionFirst } from '@/hooks/order'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

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
    description:
      'Arrastra las filas para elegir el orden en la Home y el catálogo. Las nuevas aparecen primero. Si la lista está ordenada por otra columna, pulsa el ícono de la esquina izquierda de los títulos para volver al orden manual.',
  },
  // Orden manual (campo oculto `_order`, arrastrar y soltar en la lista del admin).
  orderable: true,
  hooks: {
    beforeChange: [placeCollectionFirst],
    afterChange: [revalidateAfterChange(['collections'])],
    afterDelete: [revalidateAfterDelete(['collections'])],
  },
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
    {
      // Productos de la colección; arrastrándolos se define su orden en la tienda (campo oculto
      // `_products_products_order` en Products, independiente para cada colección).
      name: 'products',
      type: 'join',
      label: 'Productos',
      collection: 'products',
      on: 'collection',
      orderable: true,
      defaultLimit: 0,
      admin: {
        defaultColumns: ['name', 'price', 'stock', 'active'],
        description: 'Arrastra las filas para elegir el orden en la tienda. Los productos nuevos aparecen primero.',
      },
    },
  ],
}
