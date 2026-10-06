import localFont from 'next/font/local'

// Fuentes alojadas en el proyecto (src/fonts, licencia OFL, subconjunto latino: cubre el español)
// para que el build no dependa de descargarlas de Google: una descarga fallida rompía el CI.
export const displayFont = localFont({
  src: '../fonts/cormorant-garamond-latin.woff2',
  weight: '400 600',
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

export const bodyFont = localFont({
  src: '../fonts/jost-latin.woff2',
  weight: '100 900',
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

/** Clases para <html> que exponen las variables de fuente usadas por el tema. */
export const fontVariables = `${displayFont.variable} ${bodyFont.variable}`
