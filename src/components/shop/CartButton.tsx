'use client'

import { ShoppingBagIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { selectItemCount, useCart, useHydrated } from '@/stores/cart'

// Fase 3: botón con badge y panel lateral. El contenido completo del carrito
// (subtotal, total y compra por WhatsApp) se agrega en la Fase 6.
export function CartButton() {
  const hydrated = useHydrated()
  const count = useCart(selectItemCount)
  const visibleCount = hydrated ? count : 0

  return (
    <Sheet>
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
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl">Tu carrito</SheetTitle>
          <SheetDescription>
            {visibleCount > 0 ? `${visibleCount} productos` : 'Todavía no agregaste productos.'}
          </SheetDescription>
        </SheetHeader>
        {visibleCount === 0 && (
          <div className="px-4">
            <SheetClose asChild>
              <Button asChild size="lg" className="w-full">
                <Link href="/catalogo">Ver catálogo</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
