import type { Metadata } from 'next'
import React, { ViewTransition } from 'react'

import { Footer } from '@/components/shop/Footer'
import { Header } from '@/components/shop/Header'
import { HideDevIndicator } from '@/components/shop/HideDevIndicator'
import { FILTER_TRANSITION } from '@/lib/filters'
import { fontVariables } from '@/lib/fonts'
import { SITE_URL } from '@/lib/site-url'

import './styles.css'

// Se renderiza en cada request (el build no necesita la base de datos); las consultas a Payload
// están cacheadas con etiquetas que se invalidan al guardar en el admin (src/lib/cache.ts).
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
          {/* Transición suave del contenido al navegar (ver ::view-transition-* en styles.css).
              Los cambios de filtro no la usan: solo anima la grilla (ProductListing). */}
          <ViewTransition default={{ [FILTER_TRANSITION]: 'none', default: 'page-swap' }}>{children}</ViewTransition>
        </main>
        <Footer />
        {process.env.NODE_ENV === 'development' && <HideDevIndicator />}
      </body>
    </html>
  )
}
