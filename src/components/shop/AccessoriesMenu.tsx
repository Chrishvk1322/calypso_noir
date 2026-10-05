'use client'

import { ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type KeyboardEvent, type MouseEvent, useEffect, useId, useRef, useState } from 'react'

import type { AccessoryTypeLink } from '@/lib/queries'
import { scrollToTopIfSameUrl } from '@/lib/scroll'
import { cn } from '@/lib/utils'

/** Tiempo para cruzar del botón al panel sin que se cierre. */
const CLOSE_DELAY_MS = 150

type Props = {
  types: AccessoryTypeLink[]
  /** Clases del enlace de nivel superior (las mismas que el resto del menú). */
  triggerClassName: string
  mobile?: boolean
  onNavigate?: () => void
}

/**
 * Opción "Accesorios" del menú. En escritorio despliega los tipos al pasar el mouse (o con clic
 * y teclado); en el menú móvil se expande en el lugar.
 */
export function AccessoriesMenu({ types, triggerClassName, mobile = false, onNavigate }: Props) {
  const pathname = usePathname()
  const active = pathname.startsWith('/accesorios/')
  // Se guarda en qué página se abrió: al navegar a otra queda cerrado sin necesidad de un efecto.
  // En el menú móvil arranca abierto si ya estamos en un tipo de accesorio.
  const [openOn, setOpenOn] = useState<string | null>(mobile && active ? pathname : null)
  const open = openOn === pathname
  const setOpen = (value: boolean | ((current: boolean) => boolean)) =>
    setOpenOn((current) => {
      const next = typeof value === 'function' ? value(current === pathname) : value
      return next ? pathname : null
    })
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastPointer = useRef<string>('')

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Un toque o clic fuera cierra el desplegable (abierto con clic, toque o teclado).
  useEffect(() => {
    if (mobile || !open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenOn(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [mobile, open])

  const items = () => [...(rootRef.current?.querySelectorAll<HTMLAnchorElement>('[data-accessory-link]') ?? [])]

  const openNow = () => {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const closeSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  const onLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    scrollToTopIfSameUrl(event)
    if (!mobile) setOpen(false)
    onNavigate?.()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (mobile) return
    const links = items()
    const index = links.indexOf(document.activeElement as HTMLAnchorElement)

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      const focusNext = () => items()[index < 0 ? 0 : (index + 1) % links.length]?.focus()
      if (open) focusNext()
      else {
        setOpen(true)
        // Recién abierto: los enlaces se vuelven visibles en el siguiente render.
        requestAnimationFrame(focusNext)
      }
    } else if (event.key === 'ArrowUp' && index >= 0) {
      event.preventDefault()
      links[(index - 1 + links.length) % links.length]?.focus()
    }
  }

  const list = (
    <ul
      className={cn(
        mobile
          ? 'mt-1 flex flex-col border-l pl-4'
          : 'w-56 rounded-md border bg-background py-2 normal-case shadow-lg animate-in fade-in-0 slide-in-from-top-1 duration-150',
      )}
    >
      {types.map((type) => {
        const href = `/accesorios/${type.slug}`
        const current = pathname === href
        return (
          <li key={type.id}>
            <Link
              href={href}
              data-accessory-link
              aria-current={current ? 'page' : undefined}
              onClick={onLinkClick}
              className={cn(
                'block transition-colors focus-visible:outline-none',
                mobile
                  ? 'rounded-sm py-2.5 text-base text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
                  : 'px-4 py-2 text-sm tracking-normal hover:bg-secondary focus-visible:bg-secondary',
                current && 'font-medium text-foreground',
              )}
            >
              {type.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div
      ref={rootRef}
      className={cn(!mobile && 'relative')}
      onKeyDown={onKeyDown}
      // Solo el mouse abre al pasar por encima; en pantallas táctiles se usa el toque (clic).
      onPointerEnter={(event) => !mobile && event.pointerType === 'mouse' && openNow()}
      onPointerLeave={(event) => !mobile && event.pointerType === 'mouse' && closeSoon()}
      onBlur={(event) => {
        if (!mobile && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onPointerDown={(event) => {
          lastPointer.current = event.pointerType
        }}
        // Con mouse el panel ya se abrió al pasar por encima: el clic lo deja abierto. Con toque o
        // teclado (Enter/Espacio) abre y cierra.
        onClick={(event) => {
          if (!mobile && lastPointer.current === 'mouse' && event.detail > 0) openNow()
          else setOpen((value) => !value)
          lastPointer.current = ''
        }}
        // Los botones no heredan `text-transform`: así sale en mayúsculas como el resto del menú.
        className={cn(triggerClassName, 'inline-flex items-center gap-1 [text-transform:inherit]')}
        data-active={active || undefined}
      >
        Accesorios
        <ChevronDownIcon
          className={cn('size-3.5 transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {mobile ? (
        <div id={panelId} hidden={!open}>
          {list}
        </div>
      ) : (
        // `pt-3` hace de puente invisible entre el botón y el panel: el mouse no "sale" al cruzar.
        <div id={panelId} hidden={!open} className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3">
          {list}
        </div>
      )}
    </div>
  )
}
