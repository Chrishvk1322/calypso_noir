import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrActive } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const AccessoryTypes: CollectionConfig = {
  slug: 'accessory-types',
  labels: { singular: 'Tipo de accesorio', plural: 'Tipos de accesorio' },
  access: {
    read: authenticatedOrActive,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'active'],
    group: 'Tienda',
    description: 'Aparecen en el menú "Accesorios" de la tienda (aretes, collares, anillos…).',
  },
  defaultSort: ['order', 'title'],
  hooks: {
    // Cambian el menú de la tienda y las páginas /accesorios/…
    afterChange: [revalidateAfterChange(['accessory-types'])],
    afterDelete: [revalidateAfterDelete(['accessory-types', 'products'])],
  },
  fields: [
    { name: 'title', type: 'text', label: 'Nombre', required: true },
    slugField('title'),
    {
      name: 'order',
      type: 'number',
      label: 'Orden en el menú',
      admin: { position: 'sidebar', description: 'Menor número = más arriba. Si se repite, se ordena por nombre.' },
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
