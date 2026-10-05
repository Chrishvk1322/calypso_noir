import type { MouseEvent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { scrollToTopIfSameUrl } from '@/lib/scroll'

const scrollTo = vi.fn()
let reduceMotion = false

const click = (href: string, extra: Partial<MouseEvent<HTMLAnchorElement>> = {}) => {
  const event = {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    currentTarget: { href: new URL(href, 'http://localhost:3000').href },
    preventDefault: vi.fn(),
    ...extra,
  } as unknown as MouseEvent<HTMLAnchorElement>
  scrollToTopIfSameUrl(event)
  return event
}

const visit = (url: string) => {
  const location = new URL(url)
  vi.stubGlobal('window', {
    location,
    scrollTo,
    matchMedia: () => ({ matches: reduceMotion }),
  })
}

describe('scrollToTopIfSameUrl', () => {
  beforeEach(() => {
    scrollTo.mockReset()
    reduceMotion = false
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('en la misma URL no navega y sube suavemente al inicio', () => {
    visit('http://localhost:3000/')
    const event = click('/')
    expect(event.preventDefault).toHaveBeenCalled()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('sin animación si el usuario prefiere menos movimiento', () => {
    reduceMotion = true
    visit('http://localhost:3000/catalogo')
    click('/catalogo')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('deja navegar a Next si cambia la ruta, la query o hay un ancla', () => {
    visit('http://localhost:3000/?page=2')
    for (const href of ['/', '/catalogo', '/?page=3', '/?page=2#colecciones']) {
      const event = click(href)
      expect(event.preventDefault, href).not.toHaveBeenCalled()
    }
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('respeta Ctrl/⌘/Shift/Alt + clic, el botón central y eventos ya cancelados', () => {
    visit('http://localhost:3000/')
    for (const extra of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
      expect(click('/', extra).preventDefault).not.toHaveBeenCalled()
    }
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
