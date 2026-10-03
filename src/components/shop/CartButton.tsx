'use client'

import { ShoppingBagIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { selectItemCount, useCart, useHydrated } from '@/stores/cart'

import { CartSheet } from './CartSheet'

/** Botón del header con badge; abre el carrito lateral (también se abre al agregar productos). */
export function CartButton() {
  const hydrated = useHydrated()
  const count = useCart(selectItemCount)
  const isOpen = useCart((state) => state.isOpen)
  const setOpen = useCart((state) => state.setOpen)
  const visibleCount = hydrated ? count : 0

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="relative"
          aria-label={visibleCount > 0 ? `Carrito, ${visibleCount} productos` : 'Carrito vacío'}
        >
          <ShoppingBagIcon className="size-5" />
          <span
            data-testid="cart-count"
            aria-hidden
            className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] leading-5 font-medium text-primary-foreground tabular-nums data-[empty=true]:hidden"
            data-empty={visibleCount === 0}
          >
            {visibleCount}
          </span>
        </Button>
      </SheetTrigger>
      <CartSheet />
    </Sheet>
  )
}
