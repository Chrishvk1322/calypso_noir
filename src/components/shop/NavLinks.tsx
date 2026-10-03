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
            className={cn(
              'rounded-sm underline-offset-8 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              isActive(href) ? 'text-foreground underline' : 'text-muted-foreground',
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
