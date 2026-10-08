/**
 * Filtros de listados de productos (colecciones, accesorios y búsqueda): "Oferta" y "Ordenar
 * por". Viven en la URL (`?oferta=1&orden=precio-asc`) para poder compartir y paginar.
 *
 * "Destacados" es el orden que la dueña define en el admin (src/hooks/order.ts). Solo existe
 * dentro de una colección, donde es el orden por defecto; accesorios y búsqueda mezclan
 * colecciones y empiezan por "Más recientes".
 */

export const SORT_OPTIONS = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-desc', label: 'Precio: Mayor a menor' },
  { value: 'precio-asc', label: 'Precio: Menor a mayor' },
  { value: 'nombre-asc', label: 'Nombre: A - Z' },
  { value: 'nombre-desc', label: 'Nombre: Z - A' },
] as const

export type SortKey = (typeof SORT_OPTIONS)[number]['value']

export type ProductFilters = { onSale: boolean; sort: SortKey }

/**
 * Tipo de transición de los cambios de filtro: la página no hace el fundido de navegación,
 * solo la grilla de productos cambia suave (ver ProductListing y styles.css).
 */
export const FILTER_TRANSITION = 'filtro'

/** Orden por defecto: "Destacados" en una colección, "Más recientes" en los demás listados. */
export type DefaultSort = Extract<SortKey, 'destacados' | 'recientes'>

export const DEFAULT_FILTERS: ProductFilters = { onSale: false, sort: 'recientes' }

/** Opciones del selector para un listado ("Destacados" solo donde es el orden por defecto). */
export const sortOptions = (defaultSort: DefaultSort = 'recientes') =>
  SORT_OPTIONS.filter((option) => option.value !== 'destacados' || defaultSort === 'destacados')

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** Lee los filtros de la URL; valores desconocidos caen al orden por defecto del listado. */
export function parseFilters(params: SearchParams, defaultSort: DefaultSort = 'recientes'): ProductFilters {
  const sort = first(params.orden)
  const valid = sortOptions(defaultSort).some((option) => option.value === sort)
  return {
    onSale: first(params.oferta) === '1',
    sort: valid ? (sort as SortKey) : defaultSort,
  }
}

/** Parámetros de URL de los filtros activos (sin los valores por defecto del listado). */
export function filtersToParams(
  { onSale, sort }: ProductFilters,
  defaultSort: DefaultSort = 'recientes',
): Record<string, string> {
  return {
    ...(onSale ? { oferta: '1' } : {}),
    ...(sort !== defaultSort ? { orden: sort } : {}),
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
    case 'destacados':
      return ['_products_products_order', '-createdAt', '-id']
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
export function filteredHref(
  basePath: string,
  filters: ProductFilters,
  extra: Record<string, string> = {},
  defaultSort: DefaultSort = 'recientes',
) {
  const query = new URLSearchParams({ ...extra, ...filtersToParams(filters, defaultSort) }).toString()
  return `${basePath}${query ? `?${query}` : ''}`
}
