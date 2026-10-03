import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

import type { FeedCollection } from '@/lib/queries'

import { ProductCard } from './ProductCard'

export function CollectionSection({ collection, priority = false }: { collection: FeedCollection; priority?: boolean }) {
  const headingId = `coleccion-${collection.slug}`

  return (
    <section aria-labelledby={headingId} data-testid="collection-section" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="max-w-2xl space-y-1">
          <h3 id={headingId} className="text-3xl sm:text-4xl">
            {collection.title}
          </h3>
          {collection.description && <p className="text-muted-foreground">{collection.description}</p>}
        </div>
        <Link
          href={`/colecciones/${collection.slug}`}
          className="-my-3 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm tracking-wide uppercase underline-offset-8 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Ver colección
          {collection.productCount > 0 && (
            <span className="text-muted-foreground">({collection.productCount})</span>
          )}
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>

      {collection.products.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6">
          {collection.products.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} priority={priority && index < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-muted-foreground">
          Nuevas piezas muy pronto.
        </p>
      )}
    </section>
  )
}
