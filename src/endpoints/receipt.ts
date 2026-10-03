import { readFile } from 'fs/promises'
import path from 'path'
import type { Endpoint } from 'payload'

import { STOCK_APPLIED_STATUSES } from '@/hooks/orders'
import { buildReceiptPdf } from '@/lib/receipt'

const LOGO_PATH = path.resolve(process.cwd(), 'public/assets/logo.jpg')

/** GET /api/orders/:id/boleta — descarga la boleta de compra (PDF) de un pedido finalizado. */
export const receiptEndpoint: Endpoint = {
  path: '/:id/boleta',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ message: 'Debes iniciar sesión en el admin.' }, { status: 401 })
    }

    const id = String(req.routeParams?.id ?? '')
    const order = await req.payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      req,
      disableErrors: true,
    })
    if (!order) {
      return Response.json({ message: 'Pedido no encontrado.' }, { status: 404 })
    }
    if (!STOCK_APPLIED_STATUSES.includes(order.status)) {
      return Response.json(
        { message: 'Solo se puede emitir la boleta de un pedido finalizado.' },
        { status: 409 },
      )
    }

    const [site, logo] = await Promise.all([
      req.payload.findGlobal({ slug: 'site-config', depth: 0, req }),
      readFile(LOGO_PATH).catch(() => null),
    ])

    const pdf = await buildReceiptPdf({
      orderCode: order.orderCode ?? `#${order.id}`,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      saleDate: order.completedAt ?? order.updatedAt,
      items: order.items.map((item) => ({
        name: item.productName ?? 'Producto',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: order.totalAmount ?? 0,
      message: site.receiptMessage,
      store: {
        whatsappNumber: site.whatsappNumber,
        contactEmail: site.contactEmail,
        instagramUrl: site.instagramUrl,
      },
      logo,
    })

    const fileName = `boleta-${(order.orderCode ?? String(order.id)).replace(/[^A-Za-z0-9-]/g, '')}.pdf`
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}
