import { describe, expect, it } from 'vitest'

import { pageHref } from '@/components/shop/Pagination'

describe('pageHref', () => {
  it('la página 1 no lleva ?page= y las demás sí', () => {
    expect(pageHref('/colecciones/luna', 1)).toBe('/colecciones/luna')
    expect(pageHref('/colecciones/luna', 3)).toBe('/colecciones/luna?page=3')
    expect(pageHref('/', 2, 'colecciones')).toBe('/?page=2#colecciones')
  })

  it('conserva los filtros al cambiar de página', () => {
    const params = { oferta: '1', orden: 'precio-asc' }
    expect(pageHref('/accesorios/aretes', 2, undefined, params)).toBe('/accesorios/aretes?oferta=1&orden=precio-asc&page=2')
    expect(pageHref('/accesorios/aretes', 1, undefined, params)).toBe('/accesorios/aretes?oferta=1&orden=precio-asc')
  })
})
