import { ChevronRightIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { AddToCart } from '@/components/shop/AddToCart'
import { ProductCard } from '@/components/shop/ProductCard'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { RichTextContent } from '@/components/shop/RichTextContent'
import { formatPrice } from '@/lib/format'
import { getImage } from '@/lib/media'
import { getProductBySlug, getRelatedProducts } from '@/lib/queries'
import { toPlainText } from '@/lib/richtext'

// generateMetadata y la página piden el mismo producto: se consulta una sola vez por request.
const loadProduct = cache(getProductBySlug)

export async function generateMetadata({ params }: PageProps<'/productos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return {}

  const description =
    toPlainText(product.description) || `${product.name}, pieza hecha a mano en arcilla polimérica.`
  const og = getImage(product.images?.[0], 'og')

  return {
    title: product.name,
    description,
    alternates: { canonical: `/productos/${product.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} · ${formatPrice(product.price)}`,
      description,
      url: `/productos/${product.slug}`,
      siteName: 'Calypso Noir',
      locale: 'es_PE',
      images: og ? [{ url: og.url, width: og.width, height: og.height, alt: og.alt || product.name }] : undefined,
    },
    twitter: {
      card: og ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      images: og ? [og.url] : undefined,
    },
  }
}

const stockLabel = (stock: number) => {
  if (stock < 1) return 'Agotado'
  if (stock === 1) return '¡Última unidad disponible!'
  if (stock <= 3) return `¡Últimas ${stock} unidades disponibles!`
  return `${stock} unidades disponibles`
}

export default async function ProductPage({ params }: PageProps<'/productos/[slug]'>) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) notFound()

  const related = await getRelatedProducts(product)

  const images = (product.images ?? []).flatMap((media) => {
    const full = getImage(media)
    return full ? [{ full, thumb: getImage(media, 'thumbnail') }] : []
  })
  const collection = product.collection

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-8 sm:px-6 sm:py-12">
      <nav aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/catalogo" className="underline-offset-4 hover:text-foreground hover:underline">
              Catálogo
            </Link>
          </li>
          <ChevronRightIcon className="size-3.5" aria-hidden />
          <li>
            <Link href={`/colecciones/${collection.slug}`} className="underline-offset-4 hover:text-foreground hover:underline">
              {collection.title}
            </Link>
          </li>
          <ChevronRightIcon className="size-3.5" aria-hidden />
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} name={product.name} />

        <div className="flex flex-col gap-6 md:sticky md:top-24 md:self-start">
          <div className="space-y-3">
            <Link
              href={`/colecciones/${collection.slug}`}
              className="text-xs tracking-[0.25em] text-muted-foreground uppercase underline-offset-4 hover:underline"
            >
              {collection.title}
            </Link>
            <h1 className="text-4xl leading-tight sm:text-5xl">{product.name}</h1>
            <p className="text-2xl font-medium tabular-nums" data-testid="product-price">
              {formatPrice(product.price)}
            </p>
            <p
              data-testid="product-stock"
              className={product.stock < 1 ? 'text-sm text-destructive' : product.stock <= 3 ? 'text-sm font-medium text-foreground' : 'text-sm text-muted-foreground'}
            >
              {stockLabel(product.stock)}
            </p>
          </div>

          <AddToCart
            product={{
              productId: product.id,
              slug: product.slug ?? slug,
              name: product.name,
              price: product.price,
              stock: product.stock,
              image: getImage(product.images?.[0], 'thumbnail')?.url ?? null,
            }}
          />

          <div className="border-t pt-6" data-testid="product-description">
            <h2 className="sr-only">Descripción</h2>
            <RichTextContent data={product.description} />
          </div>

          <p className="text-sm text-muted-foreground">
            Hecho a mano en arcilla polimérica · Enviamos a todo el Perú
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="relacionados" className="flex flex-col gap-6 border-t pt-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="relacionados" className="text-3xl">
              Más de {collection.title}
            </h2>
            <Link
              href={`/colecciones/${collection.slug}`}
              className="text-sm tracking-wide uppercase underline-offset-8 hover:underline"
            >
              Ver colección
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-6">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
