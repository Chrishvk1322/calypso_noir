import { Cormorant_Garamond, Jost } from 'next/font/google'

export const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

export const bodyFont = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

/** Clases para <html> que exponen las variables de fuente usadas por el tema. */
export const fontVariables = `${displayFont.variable} ${bodyFont.variable}`

