import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/shop/Footer'
import { Header } from '@/components/shop/Header'

import './styles.css'

// El contenido sale del CMS: se renderiza en cada request para reflejar cambios al instante.
// (En la Fase 7 se cambia por páginas estáticas con revalidatePath desde hooks de Payload.)
export const dynamic = 'force-dynamic'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

const body = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Calypso Noir',
    template: '%s · Calypso Noir',
  },
  description: 'Piezas hechas a mano en arcilla polimérica. Enviamos a todo el Perú.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
