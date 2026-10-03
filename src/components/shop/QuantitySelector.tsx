'use client'

import { MinusIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Props = {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

/** Selector numérico acotado a 1..max. El input acepta escritura y se corrige al salir. */
export function QuantitySelector({ value, max, onChange, disabled = false, label = 'Cantidad' }: Props) {
  const clamp = (n: number) => Math.min(Math.max(1, Math.floor(n) || 1), Math.max(1, max))

  return (
    <div className="inline-flex h-11 items-center rounded-md border bg-background" role="group" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="h-full rounded-r-none"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= 1}
        aria-label="Disminuir cantidad"
      >
        <MinusIcon />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const next = Math.floor(Number(event.target.value))
          if (next >= 1) onChange(Math.min(next, max))
        }}
        onBlur={(event) => onChange(clamp(Number(event.target.value)))}
        className="h-full w-12 [appearance:textfield] border-x bg-transparent text-center tabular-nums outline-none focus-visible:bg-secondary disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="h-full rounded-l-none"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Aumentar cantidad"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
