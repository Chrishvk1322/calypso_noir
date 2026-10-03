import { Cormorant_Garamond, Jost } from 'next/font/google'

// Mismas fuentes que src/lib/fonts.ts pero sin `preload`, para la 404 global
// (src/app/global-not-found.tsx). Next incluye ese archivo en todas las rutas, admin incluido:
// con preload, el admin descargaría fuentes de la tienda que no usa. Va en un módulo aparte
// para no arrastrar las instancias con preload.
const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
  preload: false,
})

const bodyFont = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  preload: false,
})

export const fontVariablesNoPreload = `${displayFont.variable} ${bodyFont.variable}`
