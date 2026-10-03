import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
} from 'payload'

import type { Order } from '@/payload-types'

/** Estados en los que el stock del pedido está descontado (la venta está finalizada). */
export const STOCK_APPLIED_STATUSES: Order['status'][] = ['completed']

type OrderItems = Order['items'] | null | undefined

const productId = (product: unknown): number | null => {
  if (typeof product === 'number') return product
  if (product && typeof product === 'object' && 'id' in product) return Number(product.id)
  return null
}

/** Cantidad total por producto (un mismo producto puede repetirse en varias filas). */
const quantitiesByProduct = (items: OrderItems): Map<number, number> => {
  const map = new Map<number, number>()
  for (const item of items ?? []) {
    const id = productId(item.product)
    if (id === null || !item.quantity) continue
    map.set(id, (map.get(id) ?? 0) + item.quantity)
  }
  return map
}

const round2 = (n: number) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// Código de pedido
// ---------------------------------------------------------------------------

const randomCode = (digits: number) =>
  `#PED-${Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1))}`

/** Genera un código `#PED-1234` que no exista todavía (pasa a 6 dígitos si 4 se saturan). */
export const generateUniqueOrderCode = async (req: PayloadRequest): Promise<string> => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const code = randomCode(attempt < 20 ? 4 : 6)
    const { totalDocs } = await req.payload.count({
      collection: 'orders',
      where: { orderCode: { equals: code } },
      req,
    })
    if (totalDocs === 0) return code
  }
  throw new APIError('No se pudo generar un código de pedido único.', 500)
}

export const assignOrderCode: CollectionBeforeValidateHook<Order> = async ({ data, operation, req }) => {
  if (operation === 'create' && data && !data.orderCode) {
    data.orderCode = await generateUniqueOrderCode(req)
  }
  return data
}

// ---------------------------------------------------------------------------
// Nombre del producto y total
// ---------------------------------------------------------------------------

/**
 * Guarda el nombre del producto en cada ítem (histórico aunque el producto cambie o se borre)
 * y recalcula el total a partir de los ítems, para que siempre sea consistente.
 */
export const snapshotItemsAndTotal: CollectionBeforeChangeHook<Order> = async ({ data, req }) => {
  if (!data.items) return data

  for (const item of data.items) {
    const id = productId(item.product)
    if (id !== null && !item.productName) {
      const product = await req.payload.findByID({
        collection: 'products',
        id,
        depth: 0,
        req,
        disableErrors: true,
        select: { name: true },
      })
      item.productName = product?.name ?? null
    }
  }

  data.totalAmount = round2(
    data.items.reduce((total, item) => total + (item.quantity ?? 0) * (item.unitPrice ?? 0), 0),
  )
  return data
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

/**
 * Ajusta el stock según la diferencia entre lo que estaba descontado antes y lo que debe
 * estarlo ahora:
 *  - pending → completed ("Confirmar"): descuenta.
 *  - completed → pending ("Anular confirmación"): repone.
 *  - Re-guardar un pedido finalizado sin cambios: no hace nada (no descuenta dos veces).
 *  - Editar los ítems de un pedido finalizado: aplica solo la diferencia.
 * Todo corre en la transacción de la operación (`req`): si un producto no alcanza, no se
 * guarda nada.
 */
export const applyStock: CollectionBeforeChangeHook<Order> = async ({ data, originalDoc, req }) => {
  const status = data.status ?? originalDoc?.status ?? 'pending'
  const items = data.items ?? originalDoc?.items

  const previous = originalDoc?.stockApplied ? quantitiesByProduct(originalDoc.items) : new Map()
  const desired = STOCK_APPLIED_STATUSES.includes(status) ? quantitiesByProduct(items) : new Map()

  const ids = new Set([...previous.keys(), ...desired.keys()])
  const updates: { id: number; stock: number }[] = []
  const problems: string[] = []

  for (const id of ids) {
    const delta = (desired.get(id) ?? 0) - (previous.get(id) ?? 0)
    if (delta === 0) continue

    const product = await req.payload.findByID({
      collection: 'products',
      id,
      depth: 0,
      req,
      disableErrors: true,
      select: { name: true, stock: true },
    })
    if (!product) {
      // Reponer stock de un producto borrado no tiene efecto; descontarlo es un error.
      if (delta > 0) problems.push(`El producto #${id} ya no existe.`)
      continue
    }

    const stock = product.stock - delta
    if (stock < 0) {
      problems.push(`${product.name}: hay ${product.stock} en stock y el pedido necesita ${delta}.`)
      continue
    }
    updates.push({ id, stock })
  }

  if (problems.length > 0) {
    throw new APIError(`Stock insuficiente para confirmar el pedido. ${problems.join(' ')}`, 400, undefined, true)
  }

  for (const { id, stock } of updates) {
    await req.payload.update({ collection: 'products', id, data: { stock }, req, depth: 0 })
  }

  data.stockApplied = desired.size > 0
  // Fecha de venta: se fija al finalizar y se borra si se anula la confirmación.
  if (STOCK_APPLIED_STATUSES.includes(status)) {
    data.completedAt = originalDoc?.stockApplied && originalDoc.completedAt ? originalDoc.completedAt : new Date().toISOString()
  } else {
    data.completedAt = null
  }
  return data
}

/**
 * Red de seguridad: desde el admin solo se pueden borrar pedidos pendientes (ver `access.delete`),
 * pero si un script borra uno finalizado, se repone su stock.
 */
export const restoreStockOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const order = await req.payload.findByID({ collection: 'orders', id, depth: 0, req, disableErrors: true })
  if (!order?.stockApplied) return

  for (const [productIdKey, quantity] of quantitiesByProduct(order.items)) {
    const product = await req.payload.findByID({
      collection: 'products',
      id: productIdKey,
      depth: 0,
      req,
      disableErrors: true,
      select: { stock: true },
    })
    if (product) {
      await req.payload.update({
        collection: 'products',
        id: productIdKey,
        data: { stock: product.stock + quantity },
        req,
        depth: 0,
      })
    }
  }
}
