import 'server-only'

import type { Payload } from 'payload'
import { z } from 'zod'

import {
  type CheckoutError,
  type CheckoutSuccess,
  checkoutSchema,
  type StockProblem,
} from '@/lib/checkout-schema'
import { formatPrice } from '@/lib/format'
import { buildWhatsAppUrl, fillTemplate } from '@/lib/whatsapp'

export const DEFAULT_ORDER_TEMPLATE =
  '¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago.'

type CheckoutResult =
  | { status: 201; body: CheckoutSuccess }
  | { status: 400 | 409 | 500 | 503; body: CheckoutError }

const isUniqueViolation = (error: unknown) =>
  error instanceof Error && /unique|duplicate|ya existe|orderCode/i.test(`${error.message} ${JSON.stringify(error)}`)

/**
 * Registra un pedido desde el carrito:
 * 1. Valida los datos (nombre, teléfono, ítems).
 * 2. Lee precio y stock reales de la BD: nunca confía en lo que manda el cliente.
 * 3. Crea el pedido en estado "pending" (el stock se descuenta al confirmarlo en el admin).
 * 4. Devuelve el código y la URL de WhatsApp con la plantilla configurada en el CMS.
 */
export async function createOrderFromCart(payload: Payload, input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error)
    return {
      status: 400,
      body: {
        error: 'invalid',
        message: formErrors[0] ?? Object.values(fieldErrors).flat()[0] ?? 'Datos inválidos.',
        fieldErrors,
      },
    }
  }
  const { customerName, customerPhone } = parsed.data

  // Une líneas repetidas del mismo producto.
  const requested = new Map<number, number>()
  for (const { productId, quantity } of parsed.data.items) {
    requested.set(productId, (requested.get(productId) ?? 0) + quantity)
  }

  const site = await payload.findGlobal({ slug: 'site-config', depth: 0 })
  if (!site.whatsappNumber) {
    return {
      status: 503,
      body: {
        error: 'unavailable',
        message: 'Por ahora no podemos recibir pedidos por WhatsApp. Inténtalo más tarde.',
      },
    }
  }

  // Precio y stock reales; solo productos visibles al público (activos y de colección activa).
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: { id: { in: [...requested.keys()] } },
    limit: requested.size,
    depth: 1,
    select: { name: true, price: true, stock: true, collection: true },
    pagination: false,
  })
  const products = new Map(
    docs.filter((p) => typeof p.collection === 'object' && p.collection).map((p) => [p.id, p]),
  )

  const problems: StockProblem[] = []
  for (const [productId, quantity] of requested) {
    const product = products.get(productId)
    if (!product || product.stock < quantity) {
      problems.push({
        productId,
        name: product?.name ?? 'Producto no disponible',
        requested: quantity,
        available: product?.stock ?? 0,
      })
    }
  }
  if (problems.length > 0) {
    return {
      status: 409,
      body: {
        error: 'stock',
        message: 'Algunos productos ya no tienen stock suficiente. Revisa tu carrito.',
        problems,
      },
    }
  }

  const items = [...requested].map(([productId, quantity]) => {
    const product = products.get(productId)!
    return { product: productId, productName: product.name, quantity, unitPrice: product.price }
  })

  // El código lo genera el hook de Orders; si dos pedidos simultáneos chocan en el índice
  // único, se reintenta.
  let order
  for (let attempt = 1; ; attempt++) {
    try {
      order = await payload.create({
        collection: 'orders',
        data: { customerName, customerPhone, items, status: 'pending' },
        depth: 0,
      })
      break
    } catch (error) {
      if (attempt < 3 && isUniqueViolation(error)) continue
      payload.logger.error({ err: error }, 'No se pudo registrar el pedido')
      return {
        status: 500,
        body: { error: 'server', message: 'No pudimos registrar tu pedido. Inténtalo nuevamente.' },
      }
    }
  }

  const totalAmount = order.totalAmount ?? 0
  const message = fillTemplate(site.whatsappMessageTemplate || DEFAULT_ORDER_TEMPLATE, {
    orderCode: order.orderCode ?? '',
    totalAmount: totalAmount.toFixed(2),
    customerName,
    items: items.map((i) => `• ${i.quantity} x ${i.productName} (${formatPrice(i.unitPrice * i.quantity)})`).join('\n'),
  })

  return {
    status: 201,
    body: {
      orderCode: order.orderCode ?? '',
      totalAmount,
      whatsappUrl: buildWhatsAppUrl(site.whatsappNumber, message)!,
    },
  }
}
