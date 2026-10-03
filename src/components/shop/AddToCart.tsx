'use client'

import { CheckIcon, ShoppingBagIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type CartItem, useCart, useHydrated } from '@/stores/cart'

import { QuantitySelector } from './QuantitySelector'

type Props = {
  product: Omit<CartItem, 'quantity'>
}

export function AddToCart({ product }: Props) {
  const hydrated = useHydrated()
  const addItem = useCart((state) => state.addItem)
  const inCart = useCart((state) => state.items.find((i) => i.productId === product.productId)?.quantity ?? 0)

  // Lo que aún se puede agregar sin superar el stock (contando lo que ya está en el carrito).
  const available = Math.max(0, product.stock - (hydrated ? inCart : 0))
  const soldOut = product.stock < 1

  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!added) return
    const timer = setTimeout(() => setAdded(false), 2500)
    return () => clearTimeout(timer)
  }, [added])

  const selected = Math.min(quantity, Math.max(1, available))

  const handleAdd = () => {
    if (available < 1) return
    addItem(product, selected)
    setQuantity(1)
    setAdded(true)
    useCart.getState().setOpen(true)
  }

  if (soldOut) {
    return (
      <div className="flex flex-col gap-3">
        <Button size="lg" disabled className="h-12 w-full text-base">
          Agotado
        </Button>
        <p className="text-sm text-muted-foreground">
          Esta pieza se agotó. Escríbenos si quieres que la volvamos a hacer.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={selected} max={Math.max(1, available)} onChange={setQuantity} disabled={available < 1} />
        <Button
          size="lg"
          onClick={handleAdd}
          disabled={available < 1}
          className="h-11 min-w-48 flex-1 gap-2 text-base"
        >
          {added ? <CheckIcon className="size-5" /> : <ShoppingBagIcon className="size-5" />}
          {added ? 'Agregado' : 'Agregar al carrito'}
        </Button>
      </div>

      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite" data-testid="cart-status">
        {hydrated && inCart > 0 &&
          (available < 1
            ? `Ya tienes en tu carrito todas las unidades disponibles (${inCart}).`
            : `Tienes ${inCart} en tu carrito.`)}
      </p>
    </div>
  )
}
