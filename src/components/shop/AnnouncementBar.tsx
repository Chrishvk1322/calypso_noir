import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

import type { Announcement } from '@/lib/announcement'

const linkClass =
  'rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary focus-visible:outline-none'

/** Franja fina encima del carrusel con el anuncio configurado en el admin. */
export function AnnouncementBar({ announcement }: { announcement: Announcement }) {
  const { text, href, external } = announcement
  const content = (
    <>
      {text}
      {/* En línea con el texto: si este ocupa dos líneas, la flecha sigue a la última palabra. */}
      <ArrowRightIcon className="ml-1.5 inline-block size-3.5 align-[-0.15em]" aria-hidden />
    </>
  )

  return (
    <aside aria-label="Anuncio" data-testid="announcement-bar" className="bg-primary text-primary-foreground">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs leading-snug tracking-wide text-balance sm:px-6 sm:text-sm">
        {!href ? (
          text
        ) : external ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {content}
          </a>
        ) : (
          <Link href={href} className={linkClass}>
            {content}
          </Link>
        )}
      </p>
    </aside>
  )
}
