import { isOrderPending } from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'

// Estado del último pedido del cliente, para el aviso del carrito (ver useLastOrderStatus).
// Público pero mínimo: solo dice si ese código, con ese total, sigue pendiente.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code') ?? ''
  const total = Number(searchParams.get('total'))

  const payload = await getPayloadClient()
  const pending = await isOrderPending(payload, code, total)
  return Response.json({ pending }, { headers: { 'Cache-Control': 'no-store' } })
}
