import { getImage } from '@/lib/media'
import { searchCatalog, SEARCH_MIN_LENGTH } from '@/lib/queries'

export type SearchResponse = {
  query: string
  collections: { id: number; title: string; slug: string; image: string | null }[]
  products: { id: number; name: string; slug: string; price: number; stock: number; image: string | null }[]
}

// Resultados en vivo del buscador del header (máximo 5 por grupo).
export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (query.length < SEARCH_MIN_LENGTH) {
    return Response.json({ query, collections: [], products: [] } satisfies SearchResponse)
  }

  const { collections, products } = await searchCatalog(query, 5)
  return Response.json({
    query,
    collections: collections.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug ?? '',
      image: getImage(c.coverImage, 'thumbnail')?.url ?? null,
    })),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug ?? '',
      price: p.price,
      stock: p.stock,
      image: getImage(p.images?.[0], 'thumbnail')?.url ?? null,
    })),
  } satisfies SearchResponse)
}
