'use client'

import Image from 'next/image'
import Link from 'next/link'

import { scrollToTopIfSameUrl } from '@/lib/scroll'

/** Logo y nombre de la tienda: lleva al inicio (o sube al inicio si ya estamos en la Home). */
export function HomeLink() {
  return (
    <Link
      href="/"
      onClick={scrollToTopIfSameUrl}
      className="flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Image src="/assets/logo.jpg" alt="" width={40} height={40} priority className="rounded-sm" />
      <span className="font-heading text-2xl leading-none font-semibold tracking-wide">Calypso Noir</span>
    </Link>
  )
}
