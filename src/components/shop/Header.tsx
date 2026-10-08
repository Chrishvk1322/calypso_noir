import { getAccessoryTypes } from '@/lib/queries'

import { CartButton } from './CartButton'
import { HomeLink } from './HomeLink'
import { MobileNav } from './MobileNav'
import { NavLinks } from './NavLinks'
import { SearchDialog } from './SearchDialog'

export async function Header() {
  const accessoryTypes = await getAccessoryTypes()

  return (
    // Nombre propio en las View Transitions: queda fijo y por encima del contenido que se anima.
    <header
      style={{ viewTransitionName: 'site-header' }}
      className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <MobileNav accessoryTypes={accessoryTypes} />

        <HomeLink />

        <nav aria-label="Principal" className="ml-auto hidden md:block">
          <NavLinks className="flex items-center gap-8 text-sm tracking-wide uppercase" accessoryTypes={accessoryTypes} />
        </nav>

        <div className="ml-auto flex items-center md:ml-6">
          <SearchDialog />
          <CartButton />
        </div>
      </div>
    </header>
  )
}
