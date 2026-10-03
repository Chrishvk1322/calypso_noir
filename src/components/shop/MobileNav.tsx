'use client'

import { MenuIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import { NavLinks } from './NavLinks'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="size-11 md:hidden" aria-label="Abrir menú">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-2xl">Calypso Noir</SheetTitle>
          <SheetDescription className="sr-only">Menú de navegación</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menú móvil" className="px-4">
          <NavLinks
            className="flex flex-col gap-1"
            linkClassName="py-2.5 text-lg after:bottom-1.5"
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
