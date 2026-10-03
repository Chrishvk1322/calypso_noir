'use client'

import { Loader2Icon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatPrice } from '@/lib/format'
import { selectItemCount, selectSubtotal, useCart, useHydrated } from '@/stores/cart'

import { CartLine } from './CartLine'
import { CHECKOUT_FORM_ID, CheckoutForm } from './CheckoutForm'
import { WhatsAppIcon } from './icons'

export function CartSheet() {
  const hydrated = useHydrated()
  const items = useCart((state) => state.items)
  const count = useCart(selectItemCount)
  const subtotal = useCart(selectSubtotal)
  const lastOrder = useCart((state) => state.lastOrder)
  const { setOpen, setLastOrder } = useCart.getState()
  const [submitting, setSubmitting] = useState(false)

  const visibleItems = hydrated ? items : []
  // El store descarta el último pedido después de un día (ver LAST_ORDER_TTL_MS).
  const recentOrder = hydrated ? lastOrder : null
  const close = () => setOpen(false)

  return (
    <SheetContent
      side="right"
      // Ancho completo en móvil (el Sheet base usa 3/4) y sin enfocar el primer campo al abrir:
      // en un celular eso abriría el teclado. El foco queda en el propio panel.
      className="w-full gap-0 data-[side=right]:w-full sm:max-w-md data-[side=right]:sm:max-w-md"
      onOpenAutoFocus={(event) => {
        event.preventDefault()
        ;(event.currentTarget as HTMLElement | null)?.focus()
      }}
      data-testid="cart-sheet"
    >
      <SheetHeader className="border-b">
        <SheetTitle className="text-2xl">Tu carrito</SheetTitle>
        <SheetDescription>
          {count > 0 && hydrated ? `${count} ${count === 1 ? 'producto' : 'productos'}` : 'Todavía no agregaste productos.'}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        {recentOrder && visibleItems.length === 0 && (
          <div className="mt-4 rounded-md border bg-secondary/60 p-4 text-sm" data-testid="last-order" role="status">
            <div className="flex items-start justify-between gap-2">
              <p>
                Registramos tu pedido <strong className="font-medium">{recentOrder.orderCode}</strong> por{' '}
                <span className="tabular-nums">{formatPrice(recentOrder.totalAmount)}</span>. Envíanos el mensaje por
                WhatsApp para coordinar el pago.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setLastOrder(null)}
                aria-label="Ocultar aviso del pedido"
                className="-mt-1 -mr-2 shrink-0"
              >
                <XIcon />
              </Button>
            </div>
            <Button asChild variant="whatsapp" size="lg" className="mt-3 h-10 w-full gap-2">
              <a href={recentOrder.whatsappUrl}>
                <WhatsAppIcon className="size-4" />
                Abrir WhatsApp
              </a>
            </Button>
          </div>
        )}

        {visibleItems.length > 0 ? (
          <>
            <ul className="divide-y" aria-label="Productos en el carrito">
              {visibleItems.map((item) => (
                <CartLine key={item.productId} item={item} onNavigate={close} />
              ))}
            </ul>
            <div className="border-t py-6">
              <CheckoutForm onSubmittingChange={setSubmitting} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">Tu carrito está vacío.</p>
            <SheetClose asChild>
              <Button asChild size="lg" className="h-11 rounded-full px-6">
                <Link href="/catalogo">Ver catálogo</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </div>

      {visibleItems.length > 0 && (
        <SheetFooter className="gap-3 border-t bg-background">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums" data-testid="cart-subtotal">
                {formatPrice(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="text-muted-foreground">Se coordina por WhatsApp</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums" data-testid="cart-total">
                {formatPrice(subtotal)}
              </dd>
            </div>
          </dl>
          <Button
            type="submit"
            form={CHECKOUT_FORM_ID}
            variant="whatsapp"
            size="lg"
            disabled={submitting}
            className="h-12 w-full gap-2 rounded-full text-base"
          >
            {submitting ? <Loader2Icon className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
            {submitting ? 'Registrando pedido…' : 'Completar compra por WhatsApp'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Registramos tu pedido y te llevamos a WhatsApp con tu código para coordinar el pago.
          </p>
        </SheetFooter>
      )}
    </SheetContent>
  )
}
