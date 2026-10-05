import { ArrowRightIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { SEARCH_MIN_LENGTH } from '@/lib/search'

export const SEARCH_PROMPT = 'Escribe algo para empezar a buscar o revisa nuestro catálogo.'
export const SEARCH_TOO_SHORT = `Escribe al menos ${SEARCH_MIN_LENGTH} letras para buscar o revisa nuestro catálogo.`

type Props = {
  /** Lo que se escribió: si hay algo pero es muy corto, se pide más texto. */
  term?: string
  onNavigate?: () => void
  className?: string
}

/** Aviso al buscar sin texto suficiente (Enter con el campo vacío): pide escribir o ir al catálogo. */
export function SearchPrompt({ term = '', onNavigate, className }: Props) {
  return (
    <div role="status" data-testid="search-prompt" className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <SearchIcon className="size-8 text-muted-foreground" aria-hidden />
      <p className="max-w-xs text-muted-foreground">{term.trim() ? SEARCH_TOO_SHORT : SEARCH_PROMPT}</p>
      <Button asChild variant="outline" className="h-11 rounded-full px-5">
        <Link href="/catalogo" onClick={onNavigate}>
          Ver catálogo
          <ArrowRightIcon aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
