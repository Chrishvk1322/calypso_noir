'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import type { ImageData } from '@/lib/media'
import { cn } from '@/lib/utils'

import { ImageBadge } from './Price'

type GalleryImage = { full: ImageData; thumb: ImageData | null }

type Props = {
  images: GalleryImage[]
  name: string
  /** Etiqueta sobre la imagen principal, igual que en las tarjetas. */
  badge?: 'soldOut' | 'sale' | null
}

export function ProductGallery({ images, name, badge = null }: Props) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[4/5] items-center justify-center rounded-md bg-secondary font-heading text-xl text-muted-foreground">
        Sin imagen
        {badge && <ImageBadge variant={badge} />}
      </div>
    )
  }

  const go = (index: number) => setCurrent((index + images.length) % images.length)
  const image = images[current].full

  return (
    // Las flechas del teclado funcionan con el foco en cualquier parte de la galería
    // (imagen, botones o miniaturas).
    <div
      className="flex flex-col gap-4"
      data-testid="product-gallery"
      role="region"
      aria-roledescription="galería"
      aria-label={`Imágenes de ${name}`}
      onKeyDown={(event) => {
        if (images.length < 2) return
        if (event.key === 'ArrowLeft') go(current - 1)
        if (event.key === 'ArrowRight') go(current + 1)
      }}
    >
      <div
        className="group relative aspect-[4/5] overflow-hidden rounded-md bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        tabIndex={images.length > 1 ? 0 : undefined}
      >
        <Image
          key={image.url}
          src={image.url}
          alt={image.alt || name}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          data-testid="gallery-main"
        />
        {badge && <ImageBadge variant={badge} />}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(current - 1)}
              aria-label="Imagen anterior"
              className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              aria-label="Imagen siguiente"
              className="absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 shadow-sm transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <ChevronRightIcon className="size-5" />
            </button>
            <p className="absolute right-3 bottom-3 rounded-full bg-background/85 px-2.5 py-1 text-xs tabular-nums" aria-live="polite">
              {current + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-3" aria-label="Miniaturas">
          {images.map(({ full, thumb }, index) => (
            <li key={full.url}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Ver imagen ${index + 1}`}
                aria-current={index === current ? 'true' : undefined}
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-md bg-secondary ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  index === current ? 'ring-2 ring-foreground' : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image src={(thumb ?? full).url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
