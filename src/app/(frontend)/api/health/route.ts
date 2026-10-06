import { getPayloadClient } from '@/lib/payload'

// Chequeo de salud para Docker/Coolify: la app responde y llega a la base de datos.
// Sin caché: cada llamada consulta de verdad.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.count({ collection: 'users' })
    return Response.json({ status: 'ok' })
  } catch {
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
