import { z } from 'zod'

// Compartido por el formulario del carrito (cliente) y POST /api/orders (servidor).

// Mensajes por defecto de zod en español (los campos visibles tienen mensajes propios).
z.config(z.locales.es())

/** Header con el que la tienda marca sus peticiones de checkout a /api/orders. */
export const CHECKOUT_HEADER = 'x-calypso-checkout'

export const MAX_CART_LINES = 50
export const MAX_QUANTITY = 99

export const customerNameSchema = z
  .string({ error: 'Ingresa tu nombre.' })
  .transform((value) => value.replace(/\s+/g, ' ').trim())
  .pipe(
    z
      .string()
      .min(2, 'Ingresa tu nombre (mínimo 2 caracteres).')
      .max(80, 'El nombre es demasiado largo (máximo 80 caracteres).'),
  )

/** Acepta "+51 987 654 321", "987-654-321", etc. Se guarda solo con dígitos. */
export const customerPhoneSchema = z
  .string({ error: 'Ingresa tu teléfono.' })
  .transform((value) => value.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .min(9, 'Ingresa un teléfono válido (al menos 9 dígitos).')
      .max(15, 'El teléfono es demasiado largo.'),
  )

export const checkoutSchema = z.object({
  customerName: customerNameSchema,
  customerPhone: customerPhoneSchema,
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(MAX_QUANTITY),
      }),
      { error: 'El carrito está vacío.' },
    )
    .min(1, 'El carrito está vacío.')
    .max(MAX_CART_LINES, 'Demasiados productos en un solo pedido.'),
})

export type CheckoutInput = z.input<typeof checkoutSchema>

export type StockProblem = {
  productId: number
  name: string
  requested: number
  /** Unidades disponibles (0 si el producto ya no está a la venta). */
  available: number
}

export type CheckoutSuccess = {
  orderCode: string
  totalAmount: number
  whatsappUrl: string
}

export type CheckoutError =
  | { error: 'invalid'; message: string; fieldErrors: Record<string, string[] | undefined> }
  | { error: 'stock'; message: string; problems: StockProblem[] }
  | { error: 'unavailable' | 'server'; message: string }
