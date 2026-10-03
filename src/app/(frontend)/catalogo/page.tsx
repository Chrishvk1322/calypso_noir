import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CollectionCard } from '@/components/shop/CollectionCard'
import { Pagination } from '@/components/shop/Pagination'
import { parsePage } from '@/lib/format'
import { getCatalog } from '@/lib/queries'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Todas las colecciones de Calypso Noir: piezas hechas a mano en arcilla polimérica.',
}

export default async function CatalogPage({ searchParams }: PageProps<'/catalogo'>) {
  const page = parsePage((await searchParams).page)
  const { collections, pagination } = await getCatalog(page)

  if (page > 1 && page > pagination.totalPages) notFound()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 sm:px-6 sm:py-20">
      <header className="space-y-2 text-center">
        <h1 className="text-5xl sm:text-6xl">Catálogo</h1>
        <p className="text-muted-foreground">
          {pagination.totalDocs === 1 ? '1 colección' : `${pagination.totalDocs} colecciones`} hechas a mano en
          arcilla polimérica.
        </p>
      </header>

      {collections.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => (
            <li key={collection.id}>
              <CollectionCard collection={collection} priority={index < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-muted-foreground">Pronto publicaremos nuestras primeras colecciones.</p>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} basePath="/catalogo" />
    </div>
  )
}
