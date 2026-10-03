'use client'

import { useEffect } from 'react'

// Solo en desarrollo y solo en la tienda (el admin no monta este componente): oculta la insignia
// "N" de las herramientas de desarrollo de Next. En producción esa insignia no existe.
// Vive dentro del shadow DOM de <nextjs-portal>, así que el CSS de la página no la alcanza:
// se inyecta un estilo en ese shadow root. Los errores siguen viéndose en consola y terminal.
const HIDE_CSS = '[data-next-badge-root], [data-nextjs-toast] { display: none !important; }'

export function HideDevIndicator() {
  useEffect(() => {
    const inject = () => {
      const root = document.querySelector('nextjs-portal')?.shadowRoot
      if (!root || root.querySelector('style[data-calypso-hide]')) return Boolean(root)
      const style = document.createElement('style')
      style.dataset.calypsoHide = ''
      style.textContent = HIDE_CSS
      root.appendChild(style)
      return true
    }
    if (inject()) return
    // El portal se monta después de la hidratación.
    const observer = new MutationObserver(() => {
      if (inject()) observer.disconnect()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
