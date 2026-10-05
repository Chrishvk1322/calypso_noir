import Link from 'next/link'

import { Button } from '@/components/ui/button'
import type { ProductFilters as Filters } from '@/lib/filters'
import type { ProductCardData } from '@/lib/queries'

import { ProductCard } from './ProductCard'
import { ProductFilters } from './ProductFilters'

type Props = {
  products: ProductCardData[]
  filters: Filters
  /** URL del mismo listado sin el filtro "Oferta" (para el estado vacío). */
  clearSaleHref: string
  /** Mensaje si el listado no tiene productos (sin filtros). */
  emptyText?: string
  /** Cuántas imágenes cargar con prioridad (las de arriba). */
  priorityCount?: number
}

/** Filtros "Oferta" / "Ordenar por" + grilla de productos, con sus estados vacíos. */
export function ProductListing({ products, filters, clearSaleHref, emptyText = 'Nuevas piezas muy pronto.', priorityCount = 4 }: Props) {
  // Sin productos y sin filtro de oferta: no hay nada que filtrar ni ordenar.
  const showFilters = products.length > 0 || filters.onSale

  return (
    <div className="flex flex-col gap-8">
      {showFilters && <ProductFilters filters={filters} />}

      {products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4" data-testid="product-grid">
          {products.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={index < priorityCount} />
            </li>
          ))}
        </ul>
      ) : filters.onSale ? (
        <div className="flex flex-col items-center gap-4 rounded-md border border-dashed px-4 py-12 text-center" data-testid="no-sale-products">
          <p className="text-muted-foreground">No hay piezas en oferta por ahora.</p>
          <Button asChild variant="outline" className="h-11 rounded-full px-5">
            <Link href={clearSaleHref} scroll={false}>
              Ver todas las piezas
            </Link>
          </Button>
        </div>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-12 text-center text-muted-foreground">{emptyText}</p>
      )}
    </div>
  )
}
