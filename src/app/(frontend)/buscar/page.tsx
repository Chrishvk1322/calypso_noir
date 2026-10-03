import type { Metadata } from 'next'

import { SearchIcon } from 'lucide-react'

import { CollectionCard } from '@/components/shop/CollectionCard'
import { ProductCard } from '@/components/shop/ProductCard'
import { searchCatalog, SEARCH_MIN_LENGTH } from '@/lib/queries'

const FULL_RESULTS_LIMIT = 24

export async function generateMetadata({ searchParams }: PageProps<'/buscar'>): Promise<Metadata> {
  const { q } = await searchParams
  const term = (Array.isArray(q) ? q[0] : q)?.trim()
  return {
    title: term ? `Resultados para “${term}”` : 'Buscar',
    robots: { index: false },
  }
}

export default async function SearchPage({ searchParams }: PageProps<'/buscar'>) {
  const { q } = await searchParams
  const term = ((Array.isArray(q) ? q[0] : q) ?? '').trim()
  const { collections, products } =
    term.length >= SEARCH_MIN_LENGTH
      ? await searchCatalog(term, FULL_RESULTS_LIMIT)
      : { collections: [], products: [] }
  const total = collections.length + products.length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 sm:px-6 sm:py-20">
      <header className="mx-auto w-full max-w-xl space-y-6 text-center">
        <h1 className="text-5xl sm:text-6xl">Buscar</h1>
        <form action="/buscar" role="search" className="flex items-center gap-3 rounded-full border bg-background px-5">
          <SearchIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={term}
            placeholder="Buscar colecciones o productos…"
            aria-label="Buscar colecciones o productos"
            className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
        </form>
        {term.length >= SEARCH_MIN_LENGTH && (
          <p className="text-muted-foreground" role="status">
            {total === 0
              ? `No encontramos resultados para “${term}”. Prueba con otra palabra o revisa el catálogo.`
              : `${total} ${total === 1 ? 'resultado' : 'resultados'} para “${term}”.`}
          </p>
        )}
      </header>

      {collections.length > 0 && (
        <section aria-labelledby="resultados-colecciones" className="flex flex-col gap-6">
          <h2 id="resultados-colecciones" className="text-3xl">
            Colecciones
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <li key={collection.id}>
                <CollectionCard collection={collection} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {products.length > 0 && (
        <section aria-labelledby="resultados-productos" className="flex flex-col gap-6">
          <h2 id="resultados-productos" className="text-3xl">
            Productos
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
