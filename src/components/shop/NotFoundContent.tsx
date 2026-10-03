import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Mensaje compartido por la 404 de la tienda (notFound()) y la 404 global (URLs inexistentes).
export function NotFoundContent() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
      <p className="font-heading text-7xl leading-none text-muted-foreground/60 sm:text-8xl" aria-hidden>
        404
      </p>
      <h1 className="text-3xl leading-snug sm:text-4xl">
        Ops, al parecer no pudimos encontrar la página que buscas, puedes revisar nuestro{' '}
        <Link href="/catalogo" className="underline underline-offset-4 hover:text-charcoal">
          catálogo
        </Link>{' '}
        nuevamente{' '}
        <span role="img" aria-label="carita feliz">
          😊
        </span>
      </h1>
      <Button asChild size="lg" className="mt-2 h-12 rounded-full px-7 text-base">
        <Link href="/">Regresar a la página principal</Link>
      </Button>
    </section>
  )
}
