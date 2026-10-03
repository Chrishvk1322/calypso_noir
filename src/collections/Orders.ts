import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'

// Solo administradores. Los pedidos del público se crean desde POST /api/orders (Fase 6)
// mediante la Local API, que valida stock y precios en el servidor.
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'orderCode',
    defaultColumns: ['orderCode', 'status', 'totalAmount', 'customerName', 'createdAt'],
    group: 'Tienda',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'orderCode',
      type: 'text',
      label: 'Código de pedido',
      required: true,
      unique: true,
      index: true,
      validate: (value: string | null | undefined) =>
        (typeof value === 'string' && /^#PED-\d{4,}$/.test(value)) ||
        'Formato esperado: #PED-1234',
    },
    {
      name: 'status',
      type: 'select',
      label: 'Estado',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pendiente', value: 'pending' },
        { label: 'Confirmado', value: 'confirmed' },
        { label: 'Entregado', value: 'delivered' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', type: 'text', label: 'Nombre del cliente' },
        { name: 'customerPhone', type: 'text', label: 'Teléfono del cliente' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos',
      labels: { singular: 'Producto', plural: 'Productos' },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Producto',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'number',
              label: 'Cantidad',
              required: true,
              min: 1,
              validate: (value: number | null | undefined) =>
                (typeof value === 'number' && Number.isInteger(value) && value >= 1) ||
                'La cantidad debe ser un entero mayor o igual a 1.',
            },
            {
              name: 'unitPrice',
              type: 'number',
              label: 'Precio unitario (S/.)',
              required: true,
              min: 0,
            },
          ],
        },
      ],
    },
    {
      name: 'totalAmount',
      type: 'number',
      label: 'Total (S/.)',
      required: true,
      min: 0,
    },
  ],
}
