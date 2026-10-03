'use client'

import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartItem = {
  productId: number
  slug: string
  name: string
  price: number
  stock: number
  image?: string | null
  quantity: number
}

type CartState = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clear: () => void
}

const clamp = (quantity: number, stock: number) => Math.max(1, Math.min(Math.floor(quantity), stock))

// Carrito con persistencia en localStorage. El stock guardado es orientativo:
// el servidor vuelve a validarlo al crear el pedido.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
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
      clear: () => set({ items: [] }),
    }),
    {
      name: 'calypso-cart',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

export const selectItemCount = (state: CartState) =>
  state.items.reduce((total, item) => total + item.quantity, 0)

export const selectSubtotal = (state: CartState) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0)

const subscribeNoop = () => () => {}

/** `false` durante SSR y la hidratación; evita desajustes con lo guardado en localStorage. */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
