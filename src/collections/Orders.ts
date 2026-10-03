import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access'
import { receiptEndpoint } from '@/endpoints/receipt'
import { applyStock, assignOrderCode, restoreStockOnDelete, snapshotItemsAndTotal } from '@/hooks/orders'

// Solo administradores. Los pedidos de la tienda se crean desde POST /api/orders
// (src/app/(frontend)/api/orders/route.ts), que valida stock y precios en el servidor.
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    // Solo se eliminan pedidos pendientes ("Cancelar pedido"). Uno finalizado primero debe
    // volver a pendiente con "Anular confirmación", que repone el stock.
    delete: ({ req: { user } }) => (user ? { status: { equals: 'pending' } } : false),
  },
  admin: {
    useAsTitle: 'orderCode',
    defaultColumns: ['orderCode', 'status', 'customerName', 'customerPhone', 'totalAmount', 'createdAt'],
    listSearchableFields: ['orderCode', 'customerName', 'customerPhone'],
    group: 'Tienda',
    description:
      '"Confirmar" finaliza la venta y descuenta el stock. "Anular confirmación" lo devuelve a pendiente y repone el stock.',
    components: {
      edit: {
        // Botones Confirmar / Cancelar pedido / Anular confirmación / Emitir boleta.
        beforeDocumentControls: ['/components/admin/OrderActions#OrderActions'],
      },
    },
  },
  endpoints: [receiptEndpoint],
  defaultSort: '-createdAt',
  hooks: {
    beforeValidate: [assignOrderCode],
    // El orden importa: primero se completan nombres y total, luego se ajusta el stock.
    beforeChange: [snapshotItemsAndTotal, applyStock],
    beforeDelete: [restoreStockOnDelete],
  },
  fields: [
    {
      name: 'orderCode',
      type: 'text',
      label: 'Código de pedido',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Se genera automáticamente al crear el pedido.',
      },
      validate: (value: string | null | undefined) =>
        !value || /^#PED-\d{4,}$/.test(value) || 'Formato esperado: #PED-1234',
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
        { label: 'Finalizado', value: 'completed' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Se cambia con los botones de arriba. Finalizado: venta cerrada y stock descontado.',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Fecha de venta',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy - hh:mm a' },
        description: 'Se registra al confirmar el pedido.',
      },
    },
    {
      name: 'stockApplied',
      type: 'checkbox',
      label: 'Stock descontado',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Lo maneja el sistema según el estado del pedido.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'customerName',
          type: 'text',
          label: 'Nombre del cliente',
          required: true,
          validate: (value: string | null | undefined) =>
            (typeof value === 'string' && value.trim().length >= 2) || 'Ingresa el nombre del cliente.',
        },
        {
          name: 'customerPhone',
          type: 'text',
          label: 'Teléfono del cliente',
          required: true,
          validate: (value: string | null | undefined) => {
            const digits = (value ?? '').replace(/\D/g, '')
            return (digits.length >= 9 && digits.length <= 15) || 'Ingresa un teléfono válido (9 a 15 dígitos).'
          },
        },
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
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              label: 'Producto',
              required: true,
            },
            {
              name: 'productName',
              type: 'text',
              label: 'Nombre al momento de la venta',
              admin: { readOnly: true },
            },
          ],
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
      // Como orderCode, no se marca `required`: el admin valida antes de los hooks, y
      // `snapshotItemsAndTotal` siempre lo calcula.
      name: 'totalAmount',
      type: 'number',
      label: 'Total (S/.)',
      min: 0,
      admin: {
        readOnly: true,
        description: 'Se calcula a partir de los productos.',
      },
    },
  ],
}
