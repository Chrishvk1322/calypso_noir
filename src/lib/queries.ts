import 'server-only'

import { getPayloadClient } from '@/lib/payload'
import type { Collection, HeroSlide, Product } from '@/payload-types'

// Todas las consultas públicas usan `overrideAccess: false` para que el control de acceso
// (solo documentos activos) se aplique igual que para un visitante anónimo.

export const COLLECTIONS_PER_PAGE = 10
export const PREVIEW_PRODUCTS = 4
export const CATALOG_PER_PAGE = 12
export const PRODUCTS_PER_PAGE = 12

// Orden estable: más reciente primero y, ante empate de fecha, el id mayor.
const NEWEST_FIRST = ['-createdAt', '-id']

const productCardSelect = {
  name: true,
  slug: true,
  price: true,
  stock: true,
  images: true,
  createdAt: true,
} as const

export type ProductCardData = Pick<
  Product,
  'id' | 'name' | 'slug' | 'price' | 'stock' | 'images' | 'createdAt'
>

export type Pagination = {
  page: number
  totalPages: number
  totalDocs: number
}

const toPagination = (result: { page?: number; totalPages: number; totalDocs: number }): Pagination => ({
  page: result.page ?? 1,
  totalPages: result.totalPages,
  totalDocs: result.totalDocs,
})

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'hero-slides',
    overrideAccess: false,
    sort: ['order', 'createdAt'],
    limit: 3,
    depth: 1,
  })
  return docs
}

export async function getProductPreviews(
  collectionId: number,
  limit = PREVIEW_PRODUCTS,
  page = 1,
): Promise<{ products: ProductCardData[]; pagination: Pagination }> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: { collection: { equals: collectionId } },
    sort: NEWEST_FIRST,
    limit,
    page,
    depth: 1,
    select: productCardSelect,
  })
  return { products: result.docs as ProductCardData[], pagination: toPagination(result) }
}

export type FeedCollection = Pick<Collection, 'id' | 'title' | 'slug' | 'description'> & {
  products: ProductCardData[]
  productCount: number
}

/** Feed de la Home: colecciones de la más reciente a la más antigua, cada una con sus 4 productos más recientes. */
export async function getCollectionsFeed(
  page = 1,
): Promise<{ collections: FeedCollection[]; pagination: Pagination }> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    sort: NEWEST_FIRST,
    limit: COLLECTIONS_PER_PAGE,
    page,
    depth: 0,
    select: { title: true, slug: true, description: true },
  })

  const collections = await Promise.all(
    result.docs.map(async (collection) => {
      const { products, pagination } = await getProductPreviews(collection.id)
      return {
        id: collection.id,
        title: collection.title,
        slug: collection.slug,
        description: collection.description,
        products,
        productCount: pagination.totalDocs,
      }
    }),
  )

  return { collections, pagination: toPagination(result) }
}

/** Catálogo: tarjetas de colección con portada. */
export async function getCatalog(page = 1) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    sort: NEWEST_FIRST,
    limit: CATALOG_PER_PAGE,
    page,
    depth: 1,
    select: { title: true, slug: true, description: true, coverImage: true },
  })
  return { collections: result.docs, pagination: toPagination(result) }
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export type ProductDetail = Product & { collection: Collection }

/**
 * Producto activo por slug, con imágenes y colección pobladas. Devuelve null si no existe,
 * está inactivo o su colección está inactiva (el público no la recibe poblada).
 */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const product = docs[0]
  if (!product || typeof product.collection !== 'object' || !product.collection) return null
  return product as ProductDetail
}

/** Otros productos de la misma colección (los más recientes), sin el actual. */
export async function getRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductCardData[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: {
      and: [{ collection: { equals: product.collection.id } }, { id: { not_equals: product.id } }],
    },
    sort: NEWEST_FIRST,
    limit,
    depth: 1,
    select: productCardSelect,
  })
  return docs as ProductCardData[]
}
