import localFont from 'next/font/local'

// Mismas fuentes que src/lib/fonts.ts pero sin `preload`, para la 404 global
// (src/app/global-not-found.tsx). Next incluye ese archivo en todas las rutas, admin incluido:
// con preload, el admin descargaría fuentes de la tienda que no usa. Va en un módulo aparte
// para no arrastrar las instancias con preload.
const displayFont = localFont({
  src: '../fonts/cormorant-garamond-latin.woff2',
  weight: '400 600',
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  preload: false,
})

const bodyFont = localFont({
  src: '../fonts/jost-latin.woff2',
  weight: '100 900',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
  preload: false,
})

export const fontVariablesNoPreload = `${displayFont.variable} ${bodyFont.variable}`
