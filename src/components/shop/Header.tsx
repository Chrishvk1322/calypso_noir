import Image from 'next/image'
import Link from 'next/link'

import { CartButton } from './CartButton'
import { MobileNav } from './MobileNav'
import { NavLinks } from './NavLinks'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <MobileNav />

        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Image
            src="/assets/logo.jpg"
            alt=""
            width={40}
            height={40}
            priority
            className="rounded-sm"
          />
          <span className="font-heading text-2xl leading-none font-semibold tracking-wide">
            Calypso Noir
          </span>
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden md:block">
          <NavLinks className="flex items-center gap-8 text-sm tracking-wide uppercase" />
        </nav>

        <div className="ml-auto md:ml-6">
          <CartButton />
        </div>
      </div>
    </header>
  )
}
