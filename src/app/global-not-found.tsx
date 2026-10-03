import './(frontend)/styles.css'

import type { Metadata } from 'next'

import { Header } from '@/components/shop/Header'
import { NotFoundContent } from '@/components/shop/NotFoundContent'
import { fontVariables } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Página no encontrada · Calypso Noir',
  description: 'La página que buscas no existe.',
  // Esta página no hereda el ícono de la tienda (src/app/(frontend)/icon.png).
  icons: { icon: '/assets/logo.jpg' },
}

// 404 para URLs que no coinciden con ninguna ruta. Como la app tiene dos layouts raíz
// (tienda y admin), Next no usa ninguno aquí: este archivo arma su propio <html>.
export default function GlobalNotFound() {
  return (
    <html lang="es" className={fontVariables}>
      <body className="flex min-h-svh flex-col">
        <Header />
        <main id="contenido" className="flex-1">
          <NotFoundContent />
        </main>
        <footer className="border-t bg-secondary/60">
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-6">
            © {new Date().getFullYear()} Calypso Noir · Enviamos a todo el Perú
          </p>
        </footer>
      </body>
    </html>
  )
}
