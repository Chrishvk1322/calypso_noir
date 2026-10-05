import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Pagination } from '@/components/shop/Pagination'
import { ProductListing } from '@/components/shop/ProductListing'
import { filteredHref, filtersToParams, parseFilters } from '@/lib/filters'
import { parsePage } from '@/lib/format'
import { getAccessoryProducts, getAccessoryTypeBySlug, PRODUCTS_PER_PAGE } from '@/lib/queries'

export async function generateMetadata({ params }: PageProps<'/accesorios/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const type = await getAccessoryTypeBySlug(slug)
  if (!type) return {}

  const description = `${type.title} hechos a mano en arcilla polimérica por Calypso Noir.`
  return {
    title: type.title,
    description,
    alternates: { canonical: `/accesorios/${type.slug}` },
    openGraph: { title: type.title, description },
  }
}

export default async function AccessoryTypePage({ params, searchParams }: PageProps<'/accesorios/[slug]'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = parsePage(query.page)
  const filters = parseFilters(query)

  const type = await getAccessoryTypeBySlug(slug)
  if (!type) notFound()

  const { products, pagination } = await getAccessoryProducts(type.id, PRODUCTS_PER_PAGE, page, filters)
  if (page > 1 && page > pagination.totalPages) notFound()

  return (
    <>
      <header className="border-b bg-secondary/60">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm tracking-wide text-muted-foreground uppercase">Accesorios</p>
          <h1 className="text-5xl sm:text-6xl">{type.title}</h1>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
        <ProductListing
          products={products}
          filters={filters}
          clearSaleHref={filteredHref(`/accesorios/${type.slug}`, { ...filters, onSale: false })}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          basePath={`/accesorios/${type.slug}`}
          params={filtersToParams(filters)}
        />
      </div>
    </>
  )
}
