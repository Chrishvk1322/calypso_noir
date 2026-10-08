'use client'

import { ChevronDownIcon, Loader2Icon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useId, useOptimistic, useTransition } from 'react'

import { type DefaultSort, FILTER_TRANSITION, filtersToParams, type ProductFilters as Filters, type SortKey, sortOptions } from '@/lib/filters'
import { cn } from '@/lib/utils'

/**
 * Filtros "Oferta" y "Ordenar por" de un listado de productos. Cambian la URL (sin mover el
 * scroll), vuelven a la página 1 y conservan los demás parámetros (p. ej. `q` en /buscar).
 * `defaultSort` es el orden del listado sin `?orden=` ("Destacados" en una colección).
 */
export function ProductFilters({
  filters,
  defaultSort = 'recientes',
  className,
}: {
  filters: Filters
  defaultSort?: DefaultSort
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  // Muestra el cambio al instante mientras el servidor trae los productos.
  const [current, setCurrent] = useOptimistic(filters)
  const saleId = useId()
  const sortId = useId()

  const apply = (next: Filters) => {
    const params = new URLSearchParams(searchParams)
    for (const key of ['oferta', 'orden', 'page']) params.delete(key)
    for (const [key, value] of Object.entries(filtersToParams(next, defaultSort))) params.set(key, value)
    const query = params.toString()
    startTransition(() => {
      setCurrent(next)
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false, transitionTypes: [FILTER_TRANSITION] })
    })
  }

  return (
    <div
      data-testid="product-filters"
      aria-busy={pending}
      className={cn('flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y py-2', className)}
    >
      <div className="flex items-center gap-3">
        <label htmlFor={saleId} className="inline-flex h-11 cursor-pointer items-center gap-2.5 text-sm select-none">
          <input
            id={saleId}
            type="checkbox"
            checked={current.onSale}
            onChange={(event) => apply({ ...current, onSale: event.target.checked })}
            className="size-5 cursor-pointer accent-foreground"
          />
          Oferta
        </label>
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            Actualizando…
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={sortId} className="text-sm text-muted-foreground">
          Ordenar por
        </label>
        <div className="relative">
          <select
            id={sortId}
            value={current.sort}
            onChange={(event) => apply({ ...current, sort: event.target.value as SortKey })}
            className="h-11 cursor-pointer appearance-none rounded-md border border-input bg-background pr-9 pl-3 text-sm transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {sortOptions(defaultSort).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}
