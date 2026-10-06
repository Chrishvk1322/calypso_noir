import './(frontend)/styles.css'

import type { Metadata } from 'next'
import { connection } from 'next/server'

import { Header } from '@/components/shop/Header'
import { NotFoundContent } from '@/components/shop/NotFoundContent'
import { fontVariablesNoPreload } from '@/lib/fonts-no-preload'

export const metadata: Metadata = {
  title: 'Página no encontrada · Calypso Noir',
  description: 'La página que buscas no existe.',
  // Esta página no hereda el ícono de la tienda (src/app/(frontend)/icon.png).
  icons: { icon: '/assets/logo.jpg' },
}

// 404 para URLs que no coinciden con ninguna ruta. Como la app tiene dos layouts raíz
// (tienda y admin), Next no usa ninguno aquí: este archivo arma su propio <html>.
export default async function GlobalNotFound() {
  // Se renderiza en cada visita: el menú (tipos de accesorio) viene de la base, que no existe
  // durante `next build`, y así nunca queda congelado con los datos del momento de compilar.
  await connection()

  return (
    <html lang="es" className={fontVariablesNoPreload}>
      <body className="flex min-h-svh flex-col">
        <Header />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
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
