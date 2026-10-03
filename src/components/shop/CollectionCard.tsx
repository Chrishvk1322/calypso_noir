import Image from 'next/image'
import Link from 'next/link'

import { getImage } from '@/lib/media'
import type { Collection } from '@/payload-types'

type Props = {
  collection: Pick<Collection, 'title' | 'slug' | 'description' | 'coverImage'>
  priority?: boolean
  /** Nivel del título según dónde se use la tarjeta (h2 en el catálogo, h3 bajo otra sección). */
  headingLevel?: 'h2' | 'h3'
}

export function CollectionCard({ collection, priority = false, headingLevel: Heading = 'h2' }: Props) {
  const cover = getImage(collection.coverImage, 'card')

  return (
    <Link
      href={`/colecciones/${collection.slug}`}
      data-testid="collection-card"
      className="group relative flex aspect-[4/5] overflow-hidden rounded-md bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
    >
      {cover && (
        <Image
          src={cover.url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="relative mt-auto flex flex-col gap-1 p-5 text-primary-foreground">
        <Heading className="text-3xl">{collection.title}</Heading>
        {collection.description && (
          <p className="line-clamp-2 text-sm text-primary-foreground/85">{collection.description}</p>
        )}
        <span className="mt-2 text-xs tracking-widest uppercase underline-offset-8 group-hover:underline">
          Ver colección
        </span>
      </div>
    </Link>
  )
}
