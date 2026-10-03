import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Marcador temporal para secciones que se construyen en fases posteriores.
export function ComingSoon({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-5xl">{title}</h1>
      <p className="text-muted-foreground">Esta sección estará disponible muy pronto.</p>
      <Button asChild size="lg" className="mt-2">
        <Link href="/">Volver al inicio</Link>
      </Button>
      <span className="sr-only">Pendiente: fase {phase}</span>
    </section>
  )
}
