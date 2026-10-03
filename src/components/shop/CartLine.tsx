'use client'

import { Trash2Icon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'
import { type CartItem, useCart } from '@/stores/cart'

import { QuantitySelector } from './QuantitySelector'

export function CartLine({ item, onNavigate }: { item: CartItem; onNavigate: () => void }) {
  const { setQuantity, removeItem } = useCart.getState()

  return (
    <li className="flex gap-4 py-4" data-testid="cart-line">
      <Link
        href={`/productos/${item.slug}`}
        onClick={onNavigate}
        className="relative size-20 shrink-0 overflow-hidden rounded-md bg-secondary"
        tabIndex={-1}
        aria-hidden
      >
        {item.image && <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/productos/${item.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 leading-snug underline-offset-4 hover:underline"
            >
              {item.name}
            </Link>
            <p className="text-sm text-muted-foreground tabular-nums">{formatPrice(item.price)} c/u</p>
          </div>
          <p className="shrink-0 font-medium tabular-nums" data-testid="cart-line-total">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <QuantitySelector
            value={item.quantity}
            max={item.stock}
            onChange={(quantity) => setQuantity(item.productId, quantity)}
            label={`Cantidad de ${item.name}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeItem(item.productId)}
            className="h-11 gap-1.5 text-muted-foreground hover:text-destructive"
            aria-label={`Quitar ${item.name} del carrito`}
          >
            <Trash2Icon className="size-4" />
            Quitar
          </Button>
        </div>
        {item.quantity >= item.stock && (
          <p className="text-xs text-muted-foreground">Máximo disponible: {item.stock}</p>
        )}
      </div>
    </li>
  )
}
