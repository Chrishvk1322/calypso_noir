import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createOrderFromCart } from '@/lib/checkout'
import { getPayloadClient } from '@/lib/payload'
import type { Order, Product } from '@/payload-types'

let payload: Payload
let collectionId: number
let luna: Product // precio 40, stock 5
let sol: Product // precio 25.5, stock 2
let hidden: Product // inactivo

const customer = { customerName: '  Ana   Pérez ', customerPhone: '+51 987 654 321' }

const cleanDatabase = async () => {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
}

const stockOf = async (id: number) => (await payload.findByID({ collection: 'products', id, depth: 0 })).stock

const setStock = (id: number, stock: number) =>
  payload.update({ collection: 'products', id, data: { stock } })

const checkout = (input: unknown) => createOrderFromCart(payload, input)

describe('Pedidos (Fase 6)', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()

    collectionId = (await payload.create({ collection: 'collections', data: { title: 'Luna' } })).id
    luna = await payload.create({
      collection: 'products',
      data: { name: 'Aretes Luna', price: 40, stock: 5, collection: collectionId },
    })
    sol = await payload.create({
      collection: 'products',
      data: { name: 'Collar Sol', price: 25.5, stock: 2, collection: collectionId },
    })
    hidden = await payload.create({
      collection: 'products',
      data: { name: 'Oculto', price: 1, stock: 9, collection: collectionId, active: false },
    })

    await payload.updateGlobal({
      slug: 'site-config',
      data: {
        whatsappNumber: '51964588065',
        whatsappMessageTemplate:
          '¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago.',
      },
    })
  })

  beforeEach(async () => {
    await payload.delete({ collection: 'orders', where: { id: { exists: true } } })
    await setStock(luna.id, 5)
    await setStock(sol.id, 2)
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('createOrderFromCart (POST /api/orders)', () => {
    it('registra el pedido con precios de la BD, total correcto y código #PED-XXXX', async () => {
      const result = await checkout({
        ...customer,
        // El precio que mande el cliente se ignora.
        items: [
          { productId: luna.id, quantity: 2, price: 1 },
          { productId: sol.id, quantity: 1 },
        ],
      })

      expect(result.status).toBe(201)
      if (result.status !== 201) return
      expect(result.body.orderCode).toMatch(/^#PED-\d{4}$/)
      expect(result.body.totalAmount).toBe(105.5) // 2 × 40 + 1 × 25.5

      const { docs } = await payload.find({ collection: 'orders', where: { orderCode: { equals: result.body.orderCode } } })
      const order = docs[0]
      expect(order.status).toBe('pending')
      expect(order.stockApplied).toBe(false)
      expect(order.customerName).toBe('Ana Pérez')
      expect(order.customerPhone).toBe('51987654321')
      expect(order.items.map((i) => [i.productName, i.quantity, i.unitPrice])).toEqual([
        ['Aretes Luna', 2, 40],
        ['Collar Sol', 1, 25.5],
      ])
      // El stock no cambia al crear: se descuenta al confirmar.
      expect(await stockOf(luna.id)).toBe(5)
    })

    it('arma la URL de WhatsApp con la plantilla del CMS', async () => {
      const result = await checkout({ ...customer, items: [{ productId: luna.id, quantity: 1 }] })
      if (result.status !== 201) throw new Error(JSON.stringify(result.body))

      const url = new URL(result.body.whatsappUrl)
      expect(url.origin + url.pathname).toBe('https://wa.me/51964588065')
      expect(url.searchParams.get('text')).toBe(
        `¡Hola! Realicé mi pedido ${result.body.orderCode} por un total de S/.40.00. Adjunto comprobante de pago.`,
      )
    })

    it('admite las variables opcionales {customerName} e {items}', async () => {
      await payload.updateGlobal({
        slug: 'site-config',
        data: { whatsappMessageTemplate: 'Soy {customerName}. Pedido {orderCode}:\n{items}\nTotal S/.{totalAmount}' },
      })
      const result = await checkout({ ...customer, items: [{ productId: luna.id, quantity: 2 }] })
      if (result.status !== 201) throw new Error(JSON.stringify(result.body))
      expect(new URL(result.body.whatsappUrl).searchParams.get('text')).toBe(
        `Soy Ana Pérez. Pedido ${result.body.orderCode}:\n• 2 x Aretes Luna (S/. 80.00)\nTotal S/.80.00`,
      )
      await payload.updateGlobal({
        slug: 'site-config',
        data: { whatsappMessageTemplate: '¡Hola! Realicé mi pedido {orderCode} por un total de S/.{totalAmount}. Adjunto comprobante de pago.' },
      })
    })

    it('une líneas repetidas del mismo producto', async () => {
      const result = await checkout({
        ...customer,
        items: [
          { productId: luna.id, quantity: 1 },
          { productId: luna.id, quantity: 2 },
        ],
      })
      if (result.status !== 201) throw new Error(JSON.stringify(result.body))
      expect(result.body.totalAmount).toBe(120)
    })

    it('genera códigos únicos', async () => {
      const codes = new Set<string>()
      for (let i = 0; i < 8; i++) {
        const result = await checkout({ ...customer, items: [{ productId: luna.id, quantity: 1 }] })
        if (result.status !== 201) throw new Error(JSON.stringify(result.body))
        codes.add(result.body.orderCode)
      }
      expect(codes.size).toBe(8)
    })

    it.each([
      ['body vacío', {}],
      ['sin nombre', { customerPhone: '987654321', items: [{ productId: 1, quantity: 1 }] }],
      ['teléfono corto', { customerName: 'Ana', customerPhone: '1234', items: [{ productId: 1, quantity: 1 }] }],
      ['carrito vacío', { ...customer, items: [] }],
      ['cantidad 0', { ...customer, items: [{ productId: 1, quantity: 0 }] }],
      ['cantidad decimal', { ...customer, items: [{ productId: 1, quantity: 1.5 }] }],
      ['productId inválido', { ...customer, items: [{ productId: 'abc', quantity: 1 }] }],
    ])('responde 400 si el body es inválido (%s)', async (_, input) => {
      const result = await checkout(input)
      expect(result.status).toBe(400)
      expect(result.body).toMatchObject({ error: 'invalid' })
      expect(await payload.count({ collection: 'orders' })).toMatchObject({ totalDocs: 0 })
    })

    it('responde 409 si la cantidad supera el stock y no crea el pedido', async () => {
      const result = await checkout({
        ...customer,
        items: [
          { productId: sol.id, quantity: 3 },
          { productId: luna.id, quantity: 1 },
        ],
      })
      expect(result.status).toBe(409)
      expect(result.body).toMatchObject({
        error: 'stock',
        problems: [{ productId: sol.id, name: 'Collar Sol', requested: 3, available: 2 }],
      })
      expect(await payload.count({ collection: 'orders' })).toMatchObject({ totalDocs: 0 })
    })

    it('responde 409 para productos inactivos o inexistentes', async () => {
      const result = await checkout({
        ...customer,
        items: [
          { productId: hidden.id, quantity: 1 },
          { productId: 999999, quantity: 1 },
        ],
      })
      expect(result.status).toBe(409)
      if (result.status === 201 || result.body.error !== 'stock') throw new Error('se esperaba error de stock')
      expect(result.body.problems.map((p) => p.available)).toEqual([0, 0])
    })

    it('responde 503 si la tienda no tiene WhatsApp configurado', async () => {
      await payload.updateGlobal({ slug: 'site-config', data: { whatsappNumber: '' } })
      const result = await checkout({ ...customer, items: [{ productId: luna.id, quantity: 1 }] })
      expect(result.status).toBe(503)
      await payload.updateGlobal({ slug: 'site-config', data: { whatsappNumber: '51964588065' } })
    })
  })

  describe('Flujo del admin: Confirmar / Anular confirmación / Cancelar pedido', () => {
    const createPending = async (quantity = 2): Promise<Order> => {
      const result = await checkout({ ...customer, items: [{ productId: luna.id, quantity }] })
      if (result.status !== 201) throw new Error(JSON.stringify(result.body))
      const { docs } = await payload.find({ collection: 'orders', where: { orderCode: { equals: result.body.orderCode } } })
      return docs[0]
    }

    const setStatus = (id: number, status: Order['status']) =>
      payload.update({ collection: 'orders', id, data: { status } })

    const adminUser = async () => {
      const { docs } = await payload.find({ collection: 'users', where: { email: { equals: 'admin-test@calypso.test' } } })
      return (
        docs[0] ??
        (await payload.create({ collection: 'users', data: { email: 'admin-test@calypso.test', password: 'Test-1234!' } }))
      )
    }

    afterAll(async () => {
      await payload.delete({ collection: 'users', where: { email: { equals: 'admin-test@calypso.test' } } })
    })

    it('"Confirmar" (pending → completed) descuenta el stock y registra la fecha de venta', async () => {
      const order = await createPending(2)
      expect(order.completedAt ?? null).toBeNull()
      const completed = await setStatus(order.id, 'completed')
      expect(completed.stockApplied).toBe(true)
      expect(completed.completedAt).toBeTruthy()
      expect(await stockOf(luna.id)).toBe(3)
    })

    it('re-guardar un pedido finalizado no descuenta dos veces ni cambia la fecha de venta', async () => {
      const order = await createPending(2)
      const completed = await setStatus(order.id, 'completed')
      await setStatus(order.id, 'completed')
      const edited = await payload.update({ collection: 'orders', id: order.id, data: { customerName: 'Ana P.' } })
      expect(await stockOf(luna.id)).toBe(3)
      expect(edited.completedAt).toBe(completed.completedAt)
    })

    it('"Anular confirmación" (completed → pending) repone el stock y borra la fecha de venta', async () => {
      const order = await createPending(2)
      await setStatus(order.id, 'completed')
      const annulled = await setStatus(order.id, 'pending')
      expect(annulled.stockApplied).toBe(false)
      expect(annulled.completedAt ?? null).toBeNull()
      expect(await stockOf(luna.id)).toBe(5)
    })

    it('editar la cantidad de un pedido finalizado aplica solo la diferencia', async () => {
      const order = await createPending(2)
      const completed = await setStatus(order.id, 'completed')
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { items: completed.items.map((item) => ({ ...item, quantity: 4 })) },
      })
      expect(await stockOf(luna.id)).toBe(1)
    })

    it('no deja confirmar si el stock ya no alcanza (y no cambia nada)', async () => {
      const order = await createPending(2)
      await setStock(luna.id, 1)
      await expect(setStatus(order.id, 'completed')).rejects.toThrow(/Stock insuficiente/)
      expect(await stockOf(luna.id)).toBe(1)
      const unchanged = await payload.findByID({ collection: 'orders', id: order.id })
      expect(unchanged.status).toBe('pending')
      expect(unchanged.stockApplied).toBe(false)
    })

    it('si un producto no alcanza, no descuenta ninguno (transacción)', async () => {
      const result = await checkout({
        ...customer,
        items: [
          { productId: luna.id, quantity: 1 },
          { productId: sol.id, quantity: 2 },
        ],
      })
      if (result.status !== 201) throw new Error(JSON.stringify(result.body))
      const { docs } = await payload.find({ collection: 'orders', where: { orderCode: { equals: result.body.orderCode } } })
      await setStock(sol.id, 1)
      await expect(setStatus(docs[0].id, 'completed')).rejects.toThrow()
      expect(await stockOf(luna.id)).toBe(5)
      expect(await stockOf(sol.id)).toBe(1)
    })

    it('"Cancelar pedido": un admin puede eliminar un pedido pendiente', async () => {
      const order = await createPending(1)
      const user = await adminUser()
      await payload.delete({ collection: 'orders', id: order.id, overrideAccess: false, user })
      expect(await payload.count({ collection: 'orders', where: { id: { equals: order.id } } })).toMatchObject({
        totalDocs: 0,
      })
      expect(await stockOf(luna.id)).toBe(5)
    })

    it('un pedido finalizado no se puede eliminar desde el admin (primero se anula)', async () => {
      const order = await createPending(2)
      await setStatus(order.id, 'completed')
      const user = await adminUser()
      await expect(
        payload.delete({ collection: 'orders', id: order.id, overrideAccess: false, user }),
      ).rejects.toThrow()
      expect(await stockOf(luna.id)).toBe(3)
    })

    it('si un script borra un pedido finalizado, se repone el stock', async () => {
      const order = await createPending(2)
      await setStatus(order.id, 'completed')
      await payload.delete({ collection: 'orders', id: order.id })
      expect(await stockOf(luna.id)).toBe(5)
    })

    it('un pedido creado desde el admin genera su código y total', async () => {
      const order = await payload.create({
        collection: 'orders',
        data: {
          customerName: 'Venta en feria',
          customerPhone: '999888777',
          status: 'completed',
          items: [{ product: sol.id, quantity: 2, unitPrice: 20 }],
        },
      })
      expect(order.orderCode).toMatch(/^#PED-\d{4}$/)
      expect(order.totalAmount).toBe(40)
      expect(order.items[0].productName).toBe('Collar Sol')
      expect(await stockOf(sol.id)).toBe(0)
    })
  })
})
