import { describe, expect, it } from 'vitest'

import { slugify } from '@/hooks/slugify'

describe('slugify', () => {
  it('quita acentos, eñes y signos', () => {
    expect(slugify('Colección Ñandú 2025!')).toBe('coleccion-nandu-2025')
  })

  it('colapsa espacios, guiones y guiones bajos', () => {
    expect(slugify('  Aretes   de__arcilla -- negra ')).toBe('aretes-de-arcilla-negra')
  })

  it('devuelve cadena vacía si no hay caracteres válidos', () => {
    expect(slugify('¡¿?!')).toBe('')
  })
})
