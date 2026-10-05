'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartItem = {
  productId: number
  slug: string
  name: string
  /** Precio unitario al agregarlo (el de oferta si aplica); el servidor recalcula al comprar. */
  price: number
  /** Precio anterior si estaba en oferta (solo para mostrarlo tachado). */
  originalPrice?: number | null
  stock: number
  image?: string | null
  quantity: number
}

export type Customer = { name: string; phone: string }

export type LastOrder = { orderCode: string; totalAmount: number; whatsappUrl: string; createdAt: number }

type CartState = {
  items: CartItem[]
  /** Datos recordados para el próximo pedido. */
  customer: Customer
  /** Último pedido registrado (por si WhatsApp no se abrió). */
  lastOrder: LastOrder | null
  /** Panel lateral abierto (no se persiste). */
  isOpen: boolean

  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  /** Actualiza el stock conocido de un producto (p. ej. tras un 409) y recorta la cantidad. */
  updateStock: (productId: number, stock: number) => void
  clear: () => void
  setCustomer: (customer: Customer) => void
  setLastOrder: (order: LastOrder | null) => void
  setOpen: (open: boolean) => void
}

/** Durante un día se ofrece reabrir WhatsApp para el último pedido registrado. */
export const LAST_ORDER_TTL_MS = 24 * 60 * 60 * 1000

const clamp = (quantity: number, stock: number) => Math.max(1, Math.min(Math.floor(quantity), stock))

// Carrito con persistencia en localStorage. El stock guardado es orientativo:
// el servidor vuelve a validarlo al crear el pedido.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      customer: { name: '', phone: '' },
      lastOrder: null,
      isOpen: false,

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: clamp(i.quantity + quantity, item.stock) }
                  : i,
              ),
            }
          }
          if (item.stock < 1) return state
          return { items: [...state.items, { ...item, quantity: clamp(quantity, item.stock) }] }
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clamp(quantity, i.stock) } : i,
          ),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateStock: (productId, stock) =>
        set((state) => ({
          items: state.items.flatMap((i) => {
            if (i.productId !== productId) return [i]
            return stock < 1 ? [] : [{ ...i, stock, quantity: Math.min(i.quantity, stock) }]
          }),
        })),
      clear: () => set({ items: [] }),
      setCustomer: (customer) => set({ customer }),
      setLastOrder: (lastOrder) => set({ lastOrder }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: 'calypso-cart',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: ({ items, customer, lastOrder }) => ({ items, customer, lastOrder }),
      // v1 solo tenía `items`; los campos nuevos toman sus valores iniciales.
      migrate: (persisted) => persisted as Pick<CartState, 'items' | 'customer' | 'lastOrder'>,
      onRehydrateStorage: () => (state) => {
        if (state?.lastOrder && Date.now() - state.lastOrder.createdAt > LAST_ORDER_TTL_MS) {
          state.setLastOrder(null)
        }
      },
    },
  ),
)

export const selectItemCount = (state: Pick<CartState, 'items'>) =>
  state.items.reduce((total, item) => total + item.quantity, 0)

export const selectSubtotal = (state: Pick<CartState, 'items'>) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0)

const subscribeNoop = () => () => {}

/** `false` durante SSR y la hidratación; evita desajustes con lo guardado en localStorage. */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
