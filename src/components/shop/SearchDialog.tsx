'use client'

import { ArrowRightIcon, Loader2Icon, SearchIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import type { SearchResponse } from '@/app/(frontend)/api/search/route'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatPrice } from '@/lib/format'

const MIN_LENGTH = 2
const DEBOUNCE_MS = 250

type State = { status: 'idle' } | { status: 'loading' } | { status: 'done'; data: SearchResponse } | { status: 'error' }

/** Lupa del header: abre un buscador con resultados en vivo (también con Ctrl/⌘ + K). */
export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  // Atajo de teclado global.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => {
          if (value) {
            setQuery('')
            setState({ status: 'idle' })
          }
          return !value
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Búsqueda con espera corta mientras se escribe; cancela la petición anterior.
  useEffect(() => {
    const term = query.trim()
    if (term.length < MIN_LENGTH) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setState({ status: 'loading' })
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        if (!response.ok) throw new Error(String(response.status))
        setState({ status: 'done', data: (await response.json()) as SearchResponse })
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: 'error' })
        void error
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Abrir/cerrar siempre por aquí: al cerrar (Escape, ✕, clic en un resultado o Enter) se limpia
  // la búsqueda para que la próxima vez empiece vacía.
  const changeOpen = (value: boolean) => {
    setOpen(value)
    if (!value) {
      setQuery('')
      setState({ status: 'idle' })
    }
  }
  const close = () => changeOpen(false)
  const term = query.trim()
  const ready = term.length >= MIN_LENGTH
  const data = state.status === 'done' && ready ? state.data : null
  const empty = data && data.collections.length === 0 && data.products.length === 0

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="size-11" aria-label="Buscar (Ctrl + K)">
          <SearchIcon className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="top-4 max-h-[calc(100svh-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12vh] sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
        data-testid="search-dialog"
      >
        <DialogTitle className="sr-only">Buscar en la tienda</DialogTitle>
        <DialogDescription className="sr-only">Escribe para buscar colecciones y productos.</DialogDescription>

        <form
          role="search"
          className="flex items-center gap-3 border-b px-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!ready) return
            close()
            router.push(`/buscar?q=${encodeURIComponent(term)}`)
          }}
        >
          {state.status === 'loading' ? (
            <Loader2Icon className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <SearchIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          )}
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar colecciones o productos…"
            aria-label="Buscar colecciones o productos"
            aria-controls={listId}
            autoComplete="off"
            className="h-14 w-full bg-transparent pr-8 text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
        </form>

        <div id={listId} className="max-h-[60svh] overflow-y-auto" aria-live="polite">
          {!ready && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Escribe al menos {MIN_LENGTH} letras para buscar.
            </p>
          )}
          {ready && state.status === 'error' && (
            <p className="px-4 py-8 text-center text-sm text-destructive">No pudimos buscar. Inténtalo de nuevo.</p>
          )}
          {empty && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No encontramos resultados para “{data.query}”.
            </p>
          )}

          {data && data.collections.length > 0 && (
            <section aria-labelledby={`${listId}-col`} className="py-2" data-testid="search-collections">
              <h2 id={`${listId}-col`} className="px-4 py-2 font-sans text-xs font-medium text-muted-foreground uppercase">
                Colecciones
              </h2>
              <ul>
                {data.collections.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={`/colecciones/${collection.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                    >
                      <Thumb src={collection.image} />
                      <span className="font-heading text-lg">{collection.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data && data.products.length > 0 && (
            <section aria-labelledby={`${listId}-prod`} className="border-t py-2 first:border-t-0" data-testid="search-products">
              <h2 id={`${listId}-prod`} className="px-4 py-2 font-sans text-xs font-medium text-muted-foreground uppercase">
                Productos
              </h2>
              <ul>
                {data.products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/productos/${product.slug}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                    >
                      <Thumb src={product.image} />
                      <span className="min-w-0 flex-1 truncate">{product.name}</span>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {product.stock < 1 ? 'Agotado' : formatPrice(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data && !empty && (
            <Link
              href={`/buscar?q=${encodeURIComponent(data.query)}`}
              onClick={close}
              className="flex items-center justify-center gap-1.5 border-t px-4 py-3 text-sm underline-offset-4 hover:bg-secondary hover:underline focus-visible:bg-secondary focus-visible:outline-none"
            >
              Ver todos los resultados
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Thumb({ src }: { src: string | null }) {
  return (
    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-secondary">
      {src && <Image src={src} alt="" fill sizes="44px" className="object-cover" />}
    </span>
  )
}
