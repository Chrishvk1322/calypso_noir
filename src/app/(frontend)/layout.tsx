import type { Metadata } from 'next'
import React from 'react'

import { Footer } from '@/components/shop/Footer'
import { Header } from '@/components/shop/Header'
import { fontVariables } from '@/lib/fonts'
import { SITE_URL } from '@/lib/site-url'

import './styles.css'

// El contenido sale del CMS: se renderiza en cada request para reflejar cambios al instante.
// (En la Fase 7 se cambia por páginas estáticas con revalidatePath desde hooks de Payload.)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Calypso Noir',
    template: '%s · Calypso Noir',
  },
  description: 'Piezas hechas a mano en arcilla polimérica. Enviamos a todo el Perú.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
