import type { MouseEvent } from 'react'

/**
 * Un `<Link>` a la URL en la que ya estamos no hace nada visible en Next (mantiene el scroll
 * porque la página sigue en pantalla) y solo se ve la transición. En ese caso, en vez de
 * navegar, sube suavemente al inicio. Clics con modificadores (Ctrl, Shift…) siguen intactos.
 */
export function scrollToTopIfSameUrl(event: MouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const target = new URL(event.currentTarget.href, window.location.href)
  const { pathname, search } = window.location
  if (target.origin !== window.location.origin || target.pathname !== pathname || target.search !== search || target.hash) {
    return
  }

  event.preventDefault()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
}
