import { formatPrice } from '@/lib/format'
import type { Pricing } from '@/lib/pricing'
import { cn } from '@/lib/utils'

type Props = Pick<Pricing, 'price' | 'originalPrice'> & {
  /** `span` para usarlo dentro de una línea de texto (carrito, buscador). */
  as?: 'p' | 'span'
  className?: string
  'data-testid'?: string
}

/**
 * Precio de un producto. En oferta: el precio anterior tachado y al lado el de oferta,
 * destacado. Los lectores de pantalla oyen "Precio anterior … Precio de oferta …".
 */
export function Price({ price, originalPrice, as: Tag = 'p', className, ...props }: Props) {
  if (!originalPrice) {
    return (
      <Tag className={cn('tabular-nums', className)} {...props}>
        {formatPrice(price)}
      </Tag>
    )
  }

  return (
    <Tag className={cn('inline-flex flex-wrap items-baseline gap-x-2 tabular-nums', Tag === 'p' && 'flex', className)} {...props}>
      <s className="text-[0.85em] font-normal text-muted-foreground" data-price="original">
        <span className="sr-only">Precio anterior: </span>
        {formatPrice(originalPrice)}
      </s>
      <span className="text-sale" data-price="sale">
        <span className="sr-only">Precio de oferta: </span>
        {formatPrice(price)}
      </span>
    </Tag>
  )
}

/** Etiqueta sobre la imagen ("Agotado" o "En oferta"), en la esquina superior izquierda. */
export function ImageBadge({ variant }: { variant: 'soldOut' | 'sale' }) {
  return (
    <span
      data-testid={variant === 'sale' ? 'badge-sale' : 'badge-sold-out'}
      className={cn(
        'absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase',
        variant === 'sale' ? 'bg-sale text-sale-foreground' : 'bg-background/90',
      )}
    >
      {variant === 'sale' ? 'En oferta' : 'Agotado'}
    </span>
  )
}
