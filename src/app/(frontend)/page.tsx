import { notFound } from 'next/navigation'

import { CollectionSection } from '@/components/shop/CollectionSection'
import { HeroCarousel, type HeroSlideData } from '@/components/shop/HeroCarousel'
import { Pagination } from '@/components/shop/Pagination'
import { parsePage } from '@/lib/format'
import { getImage } from '@/lib/media'
import { getCollectionsFeed, getHeroSlides } from '@/lib/queries'

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const page = parsePage((await searchParams).page)
  const [slides, feed] = await Promise.all([getHeroSlides(), getCollectionsFeed(page)])

  if (page > 1 && page > feed.pagination.totalPages) notFound()

  const heroSlides: HeroSlideData[] = slides.map((slide) => ({
    id: slide.id,
    title: slide.title,
    subtitle: slide.subtitle,
    image: getImage(slide.image, 'hero'),
    // Si la colección enlazada está inactiva, Payload no la puebla y el botón no se muestra.
    href:
      slide.collectionLink && typeof slide.collectionLink === 'object'
        ? `/colecciones/${slide.collectionLink.slug}`
        : null,
  }))

  return (
    <>
      {page === 1 && <HeroCarousel slides={heroSlides} />}

      <div id="colecciones" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20">
        <header className="space-y-2 text-center">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Hecho a mano en arcilla polimérica</p>
          <h1 className="text-4xl sm:text-5xl">{page === 1 ? 'Nuestras colecciones' : `Colecciones · página ${page}`}</h1>
        </header>

        {feed.collections.length > 0 ? (
          feed.collections.map((collection, index) => (
            <CollectionSection key={collection.id} collection={collection} priority={page === 1 && index === 0 && heroSlides.length === 0} />
          ))
        ) : (
          <p className="text-center text-muted-foreground">Pronto publicaremos nuestras primeras colecciones.</p>
        )}

        <Pagination
          page={feed.pagination.page}
          totalPages={feed.pagination.totalPages}
          basePath="/"
          anchor="colecciones"
        />
      </div>
    </>
  )
}
