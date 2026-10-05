import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrActive } from '@/access'
import { slugField } from '@/fields/slug'
import { setSortFields } from '@/hooks/products'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { isValidSalePrice } from '@/lib/pricing'
import type { Product } from '@/payload-types'

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
    defaultColumns: ['name', 'collection', 'accessoryType', 'price', 'onSale', 'salePrice', 'stock', 'active'],
    group: 'Tienda',
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [setSortFields],
    afterChange: [revalidateAfterChange(['products'])],
    afterDelete: [revalidateAfterDelete(['products'])],
  },
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
    {
      type: 'row',
      fields: [
        {
          name: 'onSale',
          type: 'checkbox',
          label: 'En oferta',
          defaultValue: false,
          admin: {
            width: '50%',
            style: { alignSelf: 'center' },
            description: 'Muestra el precio anterior tachado y la etiqueta "En oferta".',
          },
        },
        {
          name: 'salePrice',
          type: 'number',
          label: 'Precio de oferta (S/.)',
          min: 0,
          admin: {
            width: '50%',
            description: 'Precio final que paga el cliente mientras dure la oferta.',
            condition: (_, siblingData) => Boolean(siblingData?.onSale),
          },
          // Un `validate` propio reemplaza la validación por defecto (incluido `min`).
          validate: (value: number | null | undefined, { siblingData }: { siblingData: Partial<Product> }) => {
            if (!siblingData.onSale) return true
            if (typeof value !== 'number') return 'Escribe el precio de oferta o desmarca "En oferta".'
            if (!isValidSalePrice(value, siblingData.price))
              return 'El precio de oferta debe ser mayor que 0 y menor que el precio normal.'
            return true
          },
        },
      ],
    },
    {
      // Precio que se cobra (oferta o normal); lo calcula un hook y sirve para ordenar por precio.
      name: 'effectivePrice',
      type: 'number',
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    {
      // Nombre en minúsculas y sin tildes; lo calcula un hook y sirve para ordenar por nombre.
      name: 'sortName',
      type: 'text',
      index: true,
      admin: { hidden: true, readOnly: true },
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
      name: 'accessoryType',
      type: 'relationship',
      relationTo: 'accessory-types',
      label: 'Tipo de accesorio',
      index: true,
      admin: { position: 'sidebar', description: 'Lo ubica en el menú "Accesorios" de la tienda.' },
      // Obligatorio al crear desde el admin y no se puede quitar una vez asignado. No es
      // `required` en la base: los productos creados antes siguen funcionando (pedidos, stock)
      // hasta que se les asigne uno.
      validate: (value: unknown, { operation, previousValue, req }: { operation?: string; previousValue?: unknown; req: { user?: unknown } }) => {
        if (value) return true
        if (operation === 'create' && req.user) return 'Elige el tipo de accesorio.'
        if (operation === 'update' && previousValue) return 'El producto debe tener un tipo de accesorio.'
        return true
      },
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
