'use client'

import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { ImageData } from '@/lib/media'
import { cn } from '@/lib/utils'

export type HeroSlideData = {
  id: number
  title?: string | null
  subtitle?: string | null
  image: ImageData | null
  href: string | null
}

const AUTOPLAY_MS = 6000

export function HeroCarousel({ slides }: { slides: HeroSlideData[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  // Sin autoplay si el usuario prefiere menos movimiento.
  const plugins = useMemo(() => {
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduceMotion || slides.length < 2
      ? []
      : [Autoplay({ delay: AUTOPLAY_MS, stopOnInteraction: true, stopOnMouseEnter: true })]
  }, [slides.length])

  useEffect(() => {
    if (!api) return
    // El índice inicial ya es 0; solo hay que seguir los cambios.
    const onSelect = () => setCurrent(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  if (slides.length === 0) return null

  // `stopOnInteraction` solo detecta arrastres en el área de slides; los clics en flechas,
  // puntos o el teclado también deben detener el autoplay.
  const stopAutoplay = () => api?.plugins()?.autoplay?.stop()

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: slides.length > 1 }}
      plugins={plugins}
      aria-label="Colecciones destacadas"
      className="group/hero"
      onPointerDownCapture={stopAutoplay}
      onKeyDown={stopAutoplay}
    >
      <CarouselContent className="ml-0">
        {slides.map((slide, index) => (
          <CarouselItem
            key={slide.id}
            className="pl-0"
            aria-label={`${index + 1} de ${slides.length}`}
            data-testid="hero-slide"
          >
            <div className="relative flex h-[70svh] min-h-[420px] max-h-[760px] items-end overflow-hidden bg-primary sm:items-center">
              {slide.image && (
                <Image
                  src={slide.image.url}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/55 sm:via-black/10 sm:to-transparent" />
              <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-0">
                <div className="max-w-xl space-y-4 text-primary-foreground">
                  {slide.title && <h2 className="text-5xl leading-[1.05] sm:text-7xl">{slide.title}</h2>}
                  {slide.subtitle && (
                    <p className="text-base text-primary-foreground/85 sm:text-lg">{slide.subtitle}</p>
                  )}
                  {slide.href && (
                    <Button
                      asChild
                      size="lg"
                      className="mt-2 h-12 rounded-full bg-background px-7 text-base text-foreground hover:bg-background/85"
                    >
                      <Link href={slide.href}>Ver colección</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {slides.length > 1 && (
        <>
          <CarouselPrevious className="left-4 hidden size-10 border-none bg-background/80 text-foreground hover:bg-background sm:inline-flex" />
          <CarouselNext className="right-4 hidden size-10 border-none bg-background/80 text-foreground hover:bg-background sm:inline-flex" />
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Ir al slide ${index + 1}`}
                aria-current={index === current ? 'true' : undefined}
                className="group/dot flex h-11 min-w-11 items-center justify-center rounded-full px-1.5 focus-visible:outline-none"
              >
                <span
                  className={cn(
                    'h-2 rounded-full bg-primary-foreground/60 transition-all group-focus-visible/dot:ring-2 group-focus-visible/dot:ring-primary-foreground group-focus-visible/dot:ring-offset-2 group-focus-visible/dot:ring-offset-black/40',
                    index === current ? 'w-8 bg-primary-foreground' : 'w-2',
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </Carousel>
  )
}
