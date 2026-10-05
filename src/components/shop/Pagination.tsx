import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type Props = {
  page: number
  totalPages: number
  /** Ruta base; la página 1 no lleva `?page=`. */
  basePath: string
  /** Ancla a la que saltar al cambiar de página (ej. "colecciones"). */
  anchor?: string
  /** Parámetros que se conservan al cambiar de página (p. ej. los filtros). */
  params?: Record<string, string>
}

export const pageHref = (basePath: string, page: number, anchor?: string, params: Record<string, string> = {}) => {
  const query = new URLSearchParams({ ...params, ...(page > 1 ? { page: String(page) } : {}) }).toString()
  return `${basePath}${query ? `?${query}` : ''}${anchor ? `#${anchor}` : ''}`
}

/** Números a mostrar: primera, última y vecinas de la actual, con "…" en los saltos. */
const pageItems = (page: number, totalPages: number): (number | 'gap')[] => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}

const itemClass =
  'inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-md px-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

export function Pagination({ page, totalPages, basePath, anchor, params }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={pageHref(basePath, page - 1, anchor, params)} rel="prev" className={cn(itemClass, 'hover:bg-secondary')}>
          <ChevronLeftIcon className="size-4" aria-hidden />
          <span className="hidden sm:inline">Anterior</span>
          <span className="sr-only sm:hidden">Página anterior</span>
        </Link>
      ) : (
        <span className={cn(itemClass, 'pointer-events-none opacity-40')} aria-hidden>
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </span>
      )}

      <ul className="flex items-center gap-1">
        {pageItems(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden>
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={pageHref(basePath, item, anchor, params)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
                className={cn(
                  itemClass,
                  item === page ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>

      {page < totalPages ? (
        <Link href={pageHref(basePath, page + 1, anchor, params)} rel="next" className={cn(itemClass, 'hover:bg-secondary')}>
          <span className="hidden sm:inline">Siguiente</span>
          <span className="sr-only sm:hidden">Página siguiente</span>
          <ChevronRightIcon className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(itemClass, 'pointer-events-none opacity-40')} aria-hidden>
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </nav>
  )
}
