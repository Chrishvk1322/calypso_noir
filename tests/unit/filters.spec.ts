import { describe, expect, it } from 'vitest'

import { DEFAULT_FILTERS, filteredHref, filtersToParams, parseFilters, toPayloadSort, toSortName } from '@/lib/filters'

describe('parseFilters', () => {
  it('lee oferta y orden de la URL', () => {
    expect(parseFilters({ oferta: '1', orden: 'precio-asc' })).toEqual({ onSale: true, sort: 'precio-asc' })
    expect(parseFilters({ orden: ['nombre-desc', 'precio-asc'] })).toEqual({ onSale: false, sort: 'nombre-desc' })
  })

  it('valores desconocidos o vacíos caen a los de por defecto', () => {
    expect(parseFilters({})).toEqual(DEFAULT_FILTERS)
    expect(parseFilters({ oferta: 'si', orden: 'barato' })).toEqual(DEFAULT_FILTERS)
  })
})

describe('filtersToParams / filteredHref', () => {
  it('omite los valores por defecto', () => {
    expect(filtersToParams(DEFAULT_FILTERS)).toEqual({})
    expect(filtersToParams({ onSale: true, sort: 'nombre-asc' })).toEqual({ oferta: '1', orden: 'nombre-asc' })
  })

  it('arma la URL conservando otros parámetros', () => {
    expect(filteredHref('/colecciones/luna', DEFAULT_FILTERS)).toBe('/colecciones/luna')
    expect(filteredHref('/buscar', { onSale: false, sort: 'precio-desc' }, { q: 'aretes sol' })).toBe(
      '/buscar?q=aretes+sol&orden=precio-desc',
    )
  })
})

describe('toPayloadSort', () => {
  it('ordena por precio que se cobra, por nombre normalizado o por fecha, con desempate estable', () => {
    expect(toPayloadSort('precio-desc')).toEqual(['-effectivePrice', '-createdAt', '-id'])
    expect(toPayloadSort('precio-asc')).toEqual(['effectivePrice', '-createdAt', '-id'])
    expect(toPayloadSort('nombre-asc')).toEqual(['sortName', '-id'])
    expect(toPayloadSort('nombre-desc')).toEqual(['-sortName', '-id'])
    expect(toPayloadSort('recientes')).toEqual(['-createdAt', '-id'])
  })
})

describe('toSortName', () => {
  it('quita tildes, pasa a minúsculas y recorta espacios', () => {
    expect(toSortName('  Ánfora Órbita ')).toBe('anfora orbita')
    expect(toSortName('Collar Constelación')).toBe('collar constelacion')
    expect(toSortName('Piña')).toBe('pina')
  })
})
