import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'

import { createOrderFromCart } from '@/lib/checkout'
import { CHECKOUT_HEADER } from '@/lib/checkout-schema'
import { getPayloadClient } from '@/lib/payload'

// /api/orders es también la ruta REST de Payload para la colección `orders` (el admin la usa
// para crear y editar pedidos). Este archivo tiene prioridad sobre el catch-all de Payload, así
// que atiende el checkout de la tienda —identificado con el header CHECKOUT_HEADER— y delega
// todo lo demás a Payload sin cambios.
const payloadContext = { params: Promise.resolve({ slug: ['orders'] }) }

const payloadPOST = REST_POST(config)

export async function POST(request: Request) {
  if (request.headers.get(CHECKOUT_HEADER) !== '1') {
    return payloadPOST(request, payloadContext)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'invalid', message: 'El cuerpo de la petición no es JSON válido.', fieldErrors: {} },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const result = await createOrderFromCart(payload, body)
  return Response.json(result.body, { status: result.status })
}

const delegate =
  (handler: ReturnType<typeof REST_GET>) =>
  (request: Request) =>
    handler(request, payloadContext)

export const GET = delegate(REST_GET(config))
export const PATCH = delegate(REST_PATCH(config))
export const PUT = delegate(REST_PUT(config))
export const DELETE = delegate(REST_DELETE(config))
export const OPTIONS = delegate(REST_OPTIONS(config))
