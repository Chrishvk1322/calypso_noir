import { ArrowLeftIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Pagination } from '@/components/shop/Pagination'
import { ProductListing } from '@/components/shop/ProductListing'
import { filteredHref, filtersToParams, parseFilters } from '@/lib/filters'
import { parsePage } from '@/lib/format'
import { getImage } from '@/lib/media'
import { getCollectionBySlug, getProductPreviews, PRODUCTS_PER_PAGE } from '@/lib/queries'

export async function generateMetadata({ params }: PageProps<'/colecciones/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)
  if (!collection) return {}

  const og = getImage(collection.coverImage, 'og')
  return {
    title: collection.title,
    description: collection.description ?? undefined,
    openGraph: {
      title: collection.title,
      description: collection.description ?? undefined,
      images: og ? [{ url: og.url, width: og.width, height: og.height, alt: collection.title }] : undefined,
    },
  }
}

export default async function CollectionPage({ params, searchParams }: PageProps<'/colecciones/[slug]'>) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const page = parsePage(query.page)
  const filters = parseFilters(query, 'destacados')

  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  const { products, pagination } = await getProductPreviews(collection.id, PRODUCTS_PER_PAGE, page, filters)
  if (page > 1 && page > pagination.totalPages) notFound()

  const cover = getImage(collection.coverImage)

  return (
    <>
      <header className="relative flex min-h-[320px] items-end overflow-hidden bg-primary text-primary-foreground sm:min-h-[400px]">
        {cover && (
          <Image src={cover.url} alt="" fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
        <div className="relative mx-auto w-full max-w-6xl space-y-3 px-4 py-10 sm:px-6">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 rounded-sm text-sm text-primary-foreground/85 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:outline-none"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            Catálogo
          </Link>
          <h1 className="text-5xl sm:text-6xl">{collection.title}</h1>
          {collection.description && (
            <p className="max-w-2xl text-primary-foreground/85 sm:text-lg">{collection.description}</p>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
        <ProductListing
          products={products}
          filters={filters}
          defaultSort="destacados"
          clearSaleHref={filteredHref(`/colecciones/${collection.slug}`, { ...filters, onSale: false }, {}, 'destacados')}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          basePath={`/colecciones/${collection.slug}`}
          params={filtersToParams(filters, 'destacados')}
        />
      </div>
    </>
  )
}
