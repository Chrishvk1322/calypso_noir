/**
 * Filtros de listados de productos (colecciones, accesorios y búsqueda): "Oferta" y "Ordenar
 * por". Viven en la URL (`?oferta=1&orden=precio-asc`) para poder compartir y paginar.
 */

export const SORT_OPTIONS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-desc', label: 'Precio: Mayor a menor' },
  { value: 'precio-asc', label: 'Precio: Menor a mayor' },
  { value: 'nombre-asc', label: 'Nombre: A - Z' },
  { value: 'nombre-desc', label: 'Nombre: Z - A' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']

export type ProductFilters = { onSale: boolean; sort: SortKey }

export const DEFAULT_FILTERS: ProductFilters = { onSale: false, sort: 'recientes' }

const SORT_KEYS = new Set<string>(SORT_OPTIONS.map((option) => option.value))

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** Lee los filtros de la URL; valores desconocidos caen al orden por defecto. */
export function parseFilters(params: SearchParams): ProductFilters {
  const sort = first(params.orden)
  return {
    onSale: first(params.oferta) === '1',
    sort: sort && SORT_KEYS.has(sort) ? (sort as SortKey) : DEFAULT_FILTERS.sort,
  }
}

/** Parámetros de URL de los filtros activos (sin los valores por defecto). */
export function filtersToParams({ onSale, sort }: ProductFilters): Record<string, string> {
  return {
    ...(onSale ? { oferta: '1' } : {}),
    ...(sort !== DEFAULT_FILTERS.sort ? { orden: sort } : {}),
  }
}

/** Orden de Payload para cada opción; el desempate por fecha e id mantiene la paginación estable. */
export function toPayloadSort(sort: SortKey): string[] {
  switch (sort) {
    case 'precio-desc':
      return ['-effectivePrice', '-createdAt', '-id']
    case 'precio-asc':
      return ['effectivePrice', '-createdAt', '-id']
    case 'nombre-asc':
      return ['sortName', '-id']
    case 'nombre-desc':
      return ['-sortName', '-id']
    default:
      return ['-createdAt', '-id']
  }
}

/**
 * Nombre normalizado para ordenar alfabéticamente igual en cualquier servidor (minúsculas y sin
 * tildes): la intercalación de PostgreSQL cambia según el sistema (en Docker Alpine ordena por
 * bytes y "Árbol" quedaría después de "Zorro").
 */
export const toSortName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** URL de un listado con los filtros dados y otros parámetros (p. ej. `q`). */
export function filteredHref(basePath: string, filters: ProductFilters, extra: Record<string, string> = {}) {
  const query = new URLSearchParams({ ...extra, ...filtersToParams(filters) }).toString()
  return `${basePath}${query ? `?${query}` : ''}`
}
