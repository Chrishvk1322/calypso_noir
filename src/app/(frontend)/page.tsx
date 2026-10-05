import { notFound } from 'next/navigation'

import { AnnouncementBar } from '@/components/shop/AnnouncementBar'
import { CollectionSection } from '@/components/shop/CollectionSection'
import { HeroCarousel, type HeroSlideData } from '@/components/shop/HeroCarousel'
import { Pagination } from '@/components/shop/Pagination'
import { getAnnouncement } from '@/lib/announcement'
import { parsePage } from '@/lib/format'
import { getImage } from '@/lib/media'
import { getCollectionsFeed, getHeroSlides } from '@/lib/queries'
import { getSiteConfig } from '@/lib/site'

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const page = parsePage((await searchParams).page)
  const [slides, feed, site] = await Promise.all([getHeroSlides(), getCollectionsFeed(page), getSiteConfig()])
  const announcement = getAnnouncement(site)

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
      {/* El h1 va antes del carrusel para que la jerarquía de títulos sea correcta. */}
      <h1 className="sr-only">Calypso Noir: piezas hechas a mano en arcilla polimérica</h1>
      {announcement && <AnnouncementBar announcement={announcement} />}
      <HeroCarousel slides={heroSlides} />

      <div id="colecciones" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20">
        <header className="space-y-2 text-center">
          <h2 className="text-4xl sm:text-5xl">Nuestras colecciones</h2>
          <p className="text-muted-foreground">Cada pieza está modelada a mano en arcilla polimérica.</p>
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
