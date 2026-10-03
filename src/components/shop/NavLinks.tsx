'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NAV_LINKS } from '@/lib/navigation'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  linkClassName?: string
  /** Se llama al navegar (el menú móvil lo usa para cerrarse). */
  onNavigate?: () => void
}

export function NavLinks({ className, linkClassName, onNavigate }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <ul className={className}>
      {NAV_LINKS.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            onClick={onNavigate}
            aria-current={isActive(href) ? 'page' : undefined}
            // Subrayado propio (pseudo-elemento) que crece desde el centro, en vez del
            // `text-decoration` que aparece de golpe.
            className={cn(
              'relative inline-block rounded-sm transition-colors duration-300 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              'after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-center after:bg-current after:transition-transform after:duration-300 after:ease-out motion-reduce:after:transition-none',
              isActive(href)
                ? 'text-foreground after:scale-x-100'
                : 'text-muted-foreground after:scale-x-0 hover:after:scale-x-100',
              linkClassName,
            )}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
