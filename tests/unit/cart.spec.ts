import { beforeEach, describe, expect, it, vi } from 'vitest'

// El store persiste en localStorage: en Node se reemplaza por uno en memoria.
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
})

const { LAST_ORDER_TTL_MS, selectItemCount, selectSubtotal, useCart } = await import('@/stores/cart')

const luna = { productId: 1, slug: 'aretes-luna', name: 'Aretes Luna', price: 40, stock: 3 }
const sol = { productId: 2, slug: 'collar-sol', name: 'Collar Sol', price: 25.5, stock: 1 }

const state = () => useCart.getState()

describe('Carrito (Zustand)', () => {
  beforeEach(() => {
    useCart.setState({ items: [], lastOrder: null, isOpen: false, customer: { name: '', phone: '' } })
  })

  it('agrega productos y suma cantidades del mismo producto sin superar el stock', () => {
    state().addItem(luna, 2)
    state().addItem(luna, 5)
    expect(state().items).toHaveLength(1)
    expect(state().items[0].quantity).toBe(3)
  })

  it('no agrega productos sin stock', () => {
    state().addItem({ ...sol, stock: 0 })
    expect(state().items).toHaveLength(0)
  })

  it('setQuantity acota entre 1 y el stock', () => {
    state().addItem(luna)
    state().setQuantity(1, 99)
    expect(state().items[0].quantity).toBe(3)
    state().setQuantity(1, 0)
    expect(state().items[0].quantity).toBe(1)
  })

  it('calcula cantidad total y subtotal', () => {
    state().addItem(luna, 2)
    state().addItem(sol)
    expect(selectItemCount(state())).toBe(3)
    expect(selectSubtotal(state())).toBe(105.5)
  })

  it('updateStock recorta la cantidad o quita el producto agotado', () => {
    state().addItem(luna, 3)
    state().addItem(sol)
    state().updateStock(1, 2)
    state().updateStock(2, 0)
    expect(state().items).toEqual([{ ...luna, stock: 2, quantity: 2 }])
  })

  it('removeItem y clear', () => {
    state().addItem(luna)
    state().addItem(sol)
    state().removeItem(1)
    expect(state().items.map((i) => i.productId)).toEqual([2])
    state().clear()
    expect(state().items).toEqual([])
  })

  it('persiste ítems, cliente y último pedido, pero no el estado del panel', () => {
    state().addItem(luna)
    state().setCustomer({ name: 'Ana', phone: '987654321' })
    state().setOpen(true)
    const saved = JSON.parse(memory.get('calypso-cart')!)
    expect(saved.version).toBe(2)
    expect(Object.keys(saved.state).sort()).toEqual(['customer', 'items', 'lastOrder'])
  })

  it('descarta el último pedido después de un día al rehidratar', async () => {
    const old = { orderCode: '#PED-1111', totalAmount: 10, whatsappUrl: 'https://wa.me/1', createdAt: Date.now() - LAST_ORDER_TTL_MS - 1000 }
    memory.set('calypso-cart', JSON.stringify({ state: { items: [], customer: { name: '', phone: '' }, lastOrder: old }, version: 2 }))
    await useCart.persist.rehydrate()
    expect(state().lastOrder).toBeNull()

    const recent = { ...old, createdAt: Date.now() }
    memory.set('calypso-cart', JSON.stringify({ state: { items: [], customer: { name: '', phone: '' }, lastOrder: recent }, version: 2 }))
    await useCart.persist.rehydrate()
    expect(state().lastOrder?.orderCode).toBe('#PED-1111')
  })

  it('migra el formato v1 (solo ítems) sin perder el carrito', async () => {
    memory.set('calypso-cart', JSON.stringify({ state: { items: [{ ...luna, quantity: 2 }] }, version: 1 }))
    await useCart.persist.rehydrate()
    expect(state().items[0].quantity).toBe(2)
    expect(state().customer).toEqual({ name: '', phone: '' })
  })
})
