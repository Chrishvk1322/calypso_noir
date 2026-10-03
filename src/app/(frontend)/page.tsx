import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Placeholder: la Home real (carrusel + feed de colecciones) se construye en la Fase 4.
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-24 text-center">
      <Image src="/assets/logo.jpg" alt="" width={120} height={120} priority className="rounded-md" />
      <h1 className="text-5xl sm:text-6xl">Calypso Noir</h1>
      <p className="text-lg text-muted-foreground">
        Piezas hechas a mano en arcilla polimérica.
      </p>
      <Button asChild size="lg" className="h-11 px-6">
        <Link href="/catalogo">Ver catálogo</Link>
      </Button>
    </section>
  )
}
