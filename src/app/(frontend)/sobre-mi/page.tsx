import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { RichTextContent } from '@/components/shop/RichTextContent'
import { Button } from '@/components/ui/button'
import { getImage } from '@/lib/media'
import { toPlainText } from '@/lib/richtext'
import { getSiteConfig } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig()
  return {
    title: 'Sobre mí',
    description: toPlainText(config.aboutUsText) || 'Conoce la historia detrás de Calypso Noir.',
  }
}

export default async function AboutPage() {
  const config = await getSiteConfig()
  const photos = (config.aboutUsPhotos ?? []).flatMap((media) => {
    const image = getImage(media, 'card')
    return image ? [image] : []
  })
  const [mainPhoto, ...otherPhotos] = photos
  const hasText = Boolean(toPlainText(config.aboutUsText))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-14 sm:px-6 sm:py-20">
      <div className={mainPhoto ? 'grid items-start gap-10 md:grid-cols-[5fr_6fr] lg:gap-16' : 'mx-auto max-w-2xl'}>
        {mainPhoto && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-secondary">
            <Image
              src={mainPhoto.url}
              alt={mainPhoto.alt}
              fill
              priority
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Calypso Noir</p>
            <h1 className="text-5xl sm:text-6xl">Sobre mí</h1>
          </header>

          {hasText ? (
            <RichTextContent data={config.aboutUsText} className="text-lg" />
          ) : (
            <p className="text-lg text-muted-foreground">Muy pronto compartiremos nuestra historia.</p>
          )}

          <Button asChild size="lg" className="mt-2 h-12 self-start rounded-full px-7 text-base">
            <Link href="/catalogo">Ver catálogo</Link>
          </Button>
        </div>
      </div>

      {otherPhotos.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6" aria-label="Más fotos">
          {otherPhotos.map((photo) => (
            <li key={photo.url} className="relative aspect-[4/5] overflow-hidden rounded-md bg-secondary">
              <Image
                src={photo.url}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
