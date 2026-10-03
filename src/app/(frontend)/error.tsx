'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

// Error inesperado al renderizar una página de la tienda (p. ej. la base de datos no responde).
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
      <title>Algo salió mal · Calypso Noir</title>
      <h1 className="text-3xl leading-snug sm:text-4xl">Algo salió mal al cargar esta página</h1>
      <p className="text-muted-foreground">
        Puede ser un problema momentáneo. Inténtalo de nuevo en unos segundos.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => retry()} className="h-12 rounded-full px-7 text-base">
          Reintentar
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
          <Link href="/">Ir a la página principal</Link>
        </Button>
      </div>
    </section>
  )
}
