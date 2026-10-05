import type { Metadata } from 'next'

import { SearchIcon } from 'lucide-react'

import { CollectionCard } from '@/components/shop/CollectionCard'
import { ProductListing } from '@/components/shop/ProductListing'
import { SearchPrompt } from '@/components/shop/SearchPrompt'
import { filteredHref, parseFilters } from '@/lib/filters'
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
  const query = await searchParams
  const { q } = query
  const term = ((Array.isArray(q) ? q[0] : q) ?? '').trim()
  // "Oferta" y "Ordenar por" solo afectan a los productos.
  const filters = parseFilters(query)
  const { collections, products } =
    term.length >= SEARCH_MIN_LENGTH
      ? await searchCatalog(term, FULL_RESULTS_LIMIT, filters)
      : { collections: [], products: [] }
  const total = collections.length + products.length
  const searched = term.length >= SEARCH_MIN_LENGTH

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
        {searched && (
          <p className="text-muted-foreground" role="status">
            {total === 0
              ? `No encontramos resultados para “${term}”. Prueba con otra palabra o revisa el catálogo.`
              : `${total} ${total === 1 ? 'resultado' : 'resultados'} para “${term}”.`}
          </p>
        )}
      </header>

      {!searched && <SearchPrompt term={term} />}

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

      {(products.length > 0 || (searched && filters.onSale)) && (
        <section aria-labelledby="resultados-productos" className="flex flex-col gap-6">
          <h2 id="resultados-productos" className="text-3xl">
            Productos
          </h2>
          <ProductListing
            products={products}
            filters={filters}
            clearSaleHref={filteredHref('/buscar', { ...filters, onSale: false }, { q: term })}
            priorityCount={0}
          />
        </section>
      )}
    </div>
  )
}
