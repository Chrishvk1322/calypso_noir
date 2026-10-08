import 'server-only'

import { slugify } from '@/hooks/slugify'
import { CACHE_TAGS as T, cached } from '@/lib/cache'
import { DEFAULT_FILTERS, type ProductFilters, toPayloadSort } from '@/lib/filters'
import { getPayloadClient } from '@/lib/payload'
import { SEARCH_MIN_LENGTH } from '@/lib/search'
import type { AccessoryType, Collection, HeroSlide, Product } from '@/payload-types'
import type { Where } from 'payload'

// Todas las consultas públicas usan `overrideAccess: false` para que el control de acceso
// (solo documentos activos) se aplique igual que para un visitante anónimo.
//
// Se exportan cacheadas (ver final del archivo): cada una se etiqueta con todo lo que lee y se
// invalida desde los hooks de Payload al guardar en el admin (src/hooks/revalidate.ts).

export const COLLECTIONS_PER_PAGE = 10
export const PREVIEW_PRODUCTS = 4
export const CATALOG_PER_PAGE = 12
export const PRODUCTS_PER_PAGE = 12

// Orden definido en el admin (src/hooks/order.ts). Desempate por fecha e id: estable al paginar.
const COLLECTION_ORDER = ['_order', '-createdAt', '-id']
const PRODUCT_ORDER = toPayloadSort('destacados')
// El orden manual de colecciones solo aplica a la Home y el catálogo; la búsqueda de colecciones
// va de la más reciente a la más antigua.
const NEWEST_FIRST = ['-createdAt', '-id']
/** Una colección empieza por "Destacados" (orden del admin); el visitante puede cambiarlo. */
const COLLECTION_FILTERS: ProductFilters = { onSale: false, sort: 'destacados' }

const productCardSelect = {
  name: true,
  slug: true,
  price: true,
  onSale: true,
  salePrice: true,
  stock: true,
  images: true,
  createdAt: true,
} as const

export type ProductCardData = Pick<
  Product,
  'id' | 'name' | 'slug' | 'price' | 'onSale' | 'salePrice' | 'stock' | 'images' | 'createdAt'
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

async function fetchHeroSlides(): Promise<HeroSlide[]> {
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

/** Condición del filtro "Oferta" (se suma a la de cada listado). */
const withFilters = (where: Where, { onSale }: ProductFilters): Where =>
  onSale ? { and: [where, { onSale: { equals: true } }] } : where

async function fetchProductPreviews(
  collectionId: number,
  limit = PREVIEW_PRODUCTS,
  page = 1,
  filters: ProductFilters = COLLECTION_FILTERS,
): Promise<{ products: ProductCardData[]; pagination: Pagination }> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: withFilters({ collection: { equals: collectionId } }, filters),
    sort: toPayloadSort(filters.sort),
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

/** Feed de la Home: colecciones en el orden del admin, cada una con sus 4 primeros productos. */
async function fetchCollectionsFeed(
  page = 1,
): Promise<{ collections: FeedCollection[]; pagination: Pagination }> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    sort: COLLECTION_ORDER,
    limit: COLLECTIONS_PER_PAGE,
    page,
    depth: 0,
    select: { title: true, slug: true, description: true },
  })

  const collections = await Promise.all(
    result.docs.map(async (collection) => {
      const { products, pagination } = await fetchProductPreviews(collection.id)
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
async function fetchCatalog(page = 1) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'collections',
    overrideAccess: false,
    sort: COLLECTION_ORDER,
    limit: CATALOG_PER_PAGE,
    page,
    depth: 1,
    select: { title: true, slug: true, description: true, coverImage: true },
  })
  return { collections: result.docs, pagination: toPagination(result) }
}

async function fetchCollectionBySlug(slug: string): Promise<Collection | null> {
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
async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
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

/** Otros productos de la misma colección (en el orden del admin), sin el actual. */
async function fetchRelatedProducts(
  collectionId: number,
  excludeProductId: number,
  limit = 4,
): Promise<ProductCardData[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: {
      and: [{ collection: { equals: collectionId } }, { id: { not_equals: excludeProductId } }],
    },
    sort: PRODUCT_ORDER,
    limit,
    depth: 1,
    select: productCardSelect,
  })
  return docs as ProductCardData[]
}

// ---------------------------------------------------------------------------
// Tipos de accesorio (menú "Accesorios" y /accesorios/[slug])
// ---------------------------------------------------------------------------

export type AccessoryTypeLink = Pick<AccessoryType, 'id' | 'title' | 'slug'>

/** Tipos activos para el menú, en el orden definido en el admin (y por nombre si empata). */
async function fetchAccessoryTypes(): Promise<AccessoryTypeLink[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'accessory-types',
    overrideAccess: false,
    sort: ['order', 'title'],
    pagination: false,
    depth: 0,
    select: { title: true, slug: true },
  })
  return docs
}

async function fetchAccessoryTypeBySlug(slug: string): Promise<AccessoryType | null> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'accessory-types',
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

/** Productos activos de un tipo de accesorio (solo de colecciones activas); por defecto, más recientes primero. */
async function fetchAccessoryProducts(
  accessoryTypeId: number,
  limit = PRODUCTS_PER_PAGE,
  page = 1,
  filters: ProductFilters = DEFAULT_FILTERS,
) {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    overrideAccess: false,
    where: withFilters(
      { and: [{ accessoryType: { equals: accessoryTypeId } }, { 'collection.active': { equals: true } }] },
      filters,
    ),
    sort: toPayloadSort(filters.sort),
    limit,
    page,
    depth: 1,
    select: productCardSelect,
  })
  return { products: result.docs as ProductCardData[], pagination: toPagination(result) }
}

// ---------------------------------------------------------------------------
// Versiones cacheadas (las que usa el frontend)
// ---------------------------------------------------------------------------

export const getHeroSlides = cached(fetchHeroSlides, 'hero-slides', [T.heroSlides, T.collections, T.media])

export const getProductPreviews = cached(fetchProductPreviews, 'product-previews', [T.products, T.media])

export const getCollectionsFeed = cached(fetchCollectionsFeed, 'collections-feed', [
  T.collections,
  T.products,
  T.media,
])

export const getCatalog = cached(fetchCatalog, 'catalog', [T.collections, T.media])

export const getCollectionBySlug = cached(fetchCollectionBySlug, 'collection-by-slug', [T.collections, T.media])

export const getProductBySlug = cached(fetchProductBySlug, 'product-by-slug', [
  T.products,
  T.collections,
  T.media,
])

export const getRelatedProducts = cached(fetchRelatedProducts, 'related-products', [T.products, T.media])

export const getAccessoryTypes = cached(fetchAccessoryTypes, 'accessory-types', [T.accessoryTypes])

export const getAccessoryTypeBySlug = cached(fetchAccessoryTypeBySlug, 'accessory-type-by-slug', [T.accessoryTypes])

export const getAccessoryProducts = cached(fetchAccessoryProducts, 'accessory-products', [
  T.products,
  T.collections,
  T.media,
])

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export type SitemapEntry = { slug: string; updatedAt: string }

/** Slugs y fecha de actualización de todas las colecciones y productos públicos. */
async function fetchSitemapEntries(): Promise<{
  collections: SitemapEntry[]
  products: SitemapEntry[]
  accessoryTypes: SitemapEntry[]
}> {
  const payload = await getPayloadClient()
  const [collections, products, accessoryTypes] = await Promise.all([
    payload.find({
      collection: 'collections',
      overrideAccess: false,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'products',
      overrideAccess: false,
      pagination: false,
      depth: 1,
      select: { slug: true, updatedAt: true, collection: true },
    }),
    payload.find({
      collection: 'accessory-types',
      overrideAccess: false,
      pagination: false,
      depth: 0,
      select: { slug: true, updatedAt: true },
    }),
  ])
  const toEntry = (doc: { slug?: string | null; updatedAt: string }) =>
    doc.slug ? [{ slug: doc.slug, updatedAt: doc.updatedAt }] : []
  return {
    collections: collections.docs.flatMap(toEntry),
    // Igual que en la página de producto: fuera si su colección no es pública.
    products: products.docs
      .filter((p) => typeof p.collection === 'object' && p.collection)
      .flatMap(toEntry),
    accessoryTypes: accessoryTypes.docs.flatMap(toEntry),
  }
}

export const getSitemapEntries = cached(fetchSitemapEntries, 'sitemap', [
  T.collections,
  T.products,
  T.accessoryTypes,
])

// ---------------------------------------------------------------------------
// Búsqueda
// ---------------------------------------------------------------------------

export type SearchResults = {
  collections: Pick<Collection, 'id' | 'title' | 'slug' | 'description' | 'coverImage'>[]
  products: ProductCardData[]
}

export { SEARCH_MIN_LENGTH }

/**
 * Busca colecciones (por título y descripción) y productos (por nombre). Además compara contra
 * el slug, que no tiene acentos: así "coleccion" encuentra "Colección".
 */
async function fetchSearchResults(
  query: string,
  limit = 5,
  filters: ProductFilters = DEFAULT_FILTERS,
): Promise<SearchResults> {
  const term = query.trim().slice(0, 80)
  if (term.length < SEARCH_MIN_LENGTH) return { collections: [], products: [] }
  const slugTerm = slugify(term)

  const payload = await getPayloadClient()
  const [collections, products] = await Promise.all([
    payload.find({
      collection: 'collections',
      overrideAccess: false,
      where: {
        or: [
          { title: { like: term } },
          { description: { like: term } },
          ...(slugTerm ? [{ slug: { like: slugTerm } }] : []),
        ],
      },
      sort: NEWEST_FIRST,
      limit,
      depth: 1,
      select: { title: true, slug: true, description: true, coverImage: true },
    }),
    payload.find({
      collection: 'products',
      overrideAccess: false,
      // Los filtros solo aplican a los productos (las colecciones se listan aparte).
      where: withFilters(
        { or: [{ name: { like: term } }, ...(slugTerm ? [{ slug: { like: slugTerm } }] : [])] },
        filters,
      ),
      sort: toPayloadSort(filters.sort),
      limit,
      depth: 1,
      select: productCardSelect,
    }),
  ])

  return {
    collections: collections.docs,
    products: products.docs as ProductCardData[],
  }
}

export const searchCatalog = cached(fetchSearchResults, 'search', [T.collections, T.products, T.media])
