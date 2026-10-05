'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'

import { NAV_LINKS } from '@/lib/navigation'
import type { AccessoryTypeLink } from '@/lib/queries'
import { scrollToTopIfSameUrl } from '@/lib/scroll'
import { cn } from '@/lib/utils'

import { AccessoriesMenu } from './AccessoriesMenu'

type Props = {
  className?: string
  linkClassName?: string
  /** Tipos de accesorio del menú "Accesorios" (si no hay, la opción no aparece). */
  accessoryTypes?: AccessoryTypeLink[]
  /** Variante del menú hamburguesa: "Accesorios" se expande en el lugar. */
  mobile?: boolean
  /** Se llama al navegar (el menú móvil lo usa para cerrarse). */
  onNavigate?: () => void
}

export function NavLinks({ className, linkClassName, accessoryTypes = [], mobile = false, onNavigate }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  // Subrayado propio (pseudo-elemento) que crece desde el centro, en vez del `text-decoration`
  // que aparece de golpe.
  const itemClass = (active: boolean) =>
    cn(
      'relative inline-block rounded-sm transition-colors duration-300 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
      'after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-center after:bg-current after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none',
      active
        ? 'text-foreground after:scale-x-100'
        : 'text-muted-foreground after:scale-x-0 hover:after:scale-x-100',
      linkClassName,
    )

  return (
    <ul className={className}>
      {NAV_LINKS.map(({ href, label }) => (
        <Fragment key={href}>
          <li>
            <Link
              href={href}
              onClick={(event) => {
                scrollToTopIfSameUrl(event)
                onNavigate?.()
              }}
              aria-current={isActive(href) ? 'page' : undefined}
              className={itemClass(isActive(href))}
            >
              {label}
            </Link>
          </li>
          {/* "Accesorios" va justo después de "Catálogo". */}
          {href === '/catalogo' && accessoryTypes.length > 0 && (
            <li>
              <AccessoriesMenu
                types={accessoryTypes}
                triggerClassName={itemClass(pathname.startsWith('/accesorios/'))}
                mobile={mobile}
                onNavigate={onNavigate}
              />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  )
}
