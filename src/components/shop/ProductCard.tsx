import Image from 'next/image'
import Link from 'next/link'

import { formatPrice } from '@/lib/format'
import { getImage } from '@/lib/media'
import type { ProductCardData } from '@/lib/queries'

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const image = getImage(product.images?.[0], 'card')
  const soldOut = product.stock < 1

  return (
    <Link
      href={`/productos/${product.slug}`}
      data-testid="product-card"
      className="group flex flex-col gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-secondary">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-heading text-muted-foreground">
            Sin imagen
          </div>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            Agotado
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-snug sm:text-base">{product.name}</p>
        <p className="text-sm font-medium tabular-nums">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
