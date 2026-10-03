'use client'

import { AlertCircleIcon } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CHECKOUT_HEADER,
  type CheckoutError,
  type CheckoutSuccess,
  customerNameSchema,
  customerPhoneSchema,
} from '@/lib/checkout-schema'
import { useCart } from '@/stores/cart'

export const CHECKOUT_FORM_ID = 'checkout-form'

type FieldErrors = { customerName?: string; customerPhone?: string }

type Props = {
  onSubmittingChange: (submitting: boolean) => void
}

/**
 * Datos del cliente + envío del pedido. El botón de envío vive en el pie del panel
 * (`form={CHECKOUT_FORM_ID}`) para que quede siempre visible.
 */
export function CheckoutForm({ onSubmittingChange }: Props) {
  const items = useCart((state) => state.items)
  const savedCustomer = useCart((state) => state.customer)
  const { clear, setCustomer, setLastOrder, updateStock } = useCart.getState()

  const [name, setName] = useState(savedCustomer.name)
  const [phone, setPhone] = useState(savedCustomer.phone)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [stockNotes, setStockNotes] = useState<string[]>([])

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {}
    const nameResult = customerNameSchema.safeParse(name)
    const phoneResult = customerPhoneSchema.safeParse(phone)
    if (!nameResult.success) errors.customerName = nameResult.error.issues[0]?.message
    if (!phoneResult.success) errors.customerPhone = phoneResult.error.issues[0]?.message
    return errors
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setStockNotes([])

    const errors = validate()
    setFieldErrors(errors)
    if (errors.customerName || errors.customerPhone) {
      document.getElementById(errors.customerName ? 'checkout-name' : 'checkout-phone')?.focus()
      return
    }

    onSubmittingChange(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [CHECKOUT_HEADER]: '1' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        }),
      })
      const data = (await response.json()) as CheckoutSuccess | CheckoutError

      if (response.status === 201 && 'orderCode' in data) {
        setCustomer({ name: name.trim(), phone: phone.trim() })
        setLastOrder({ ...data, createdAt: Date.now() })
        clear()
        window.location.assign(data.whatsappUrl)
        return
      }

      if ('error' in data && data.error === 'stock') {
        // El servidor no informa el nombre de productos que ya no son públicos: se usa el del carrito.
        const nameOf = (productId: number, fallback: string) =>
          items.find((item) => item.productId === productId)?.name ?? fallback
        setStockNotes(
          data.problems.map((p) => {
            const name = nameOf(p.productId, p.name)
            if (p.available < 1) return `${name} ya no está disponible y se quitó de tu carrito.`
            return `${name}: solo ${p.available === 1 ? 'queda 1' : `quedan ${p.available}`}. Ajustamos la cantidad.`
          }),
        )
        for (const problem of data.problems) updateStock(problem.productId, problem.available)
        setFormError(data.message)
      } else if ('error' in data && data.error === 'invalid') {
        setFieldErrors({
          customerName: data.fieldErrors.customerName?.[0],
          customerPhone: data.fieldErrors.customerPhone?.[0],
        })
        setFormError(data.message)
      } else {
        setFormError('message' in data ? data.message : 'No pudimos registrar tu pedido.')
      }
    } catch {
      setFormError('No pudimos conectar con la tienda. Revisa tu conexión e inténtalo nuevamente.')
    } finally {
      onSubmittingChange(false)
    }
  }

  return (
    <form id={CHECKOUT_FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" data-testid="checkout-form">
      <div>
        <h3 className="font-heading text-xl">Tus datos</h3>
        <p className="text-sm text-muted-foreground">Los usamos para registrar tu pedido y coordinar el pago y envío.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkout-name">Nombre y apellido</Label>
        <Input
          id="checkout-name"
          name="customerName"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(fieldErrors.customerName)}
          aria-describedby={fieldErrors.customerName ? 'checkout-name-error' : undefined}
          className="h-11 bg-background text-base"
          maxLength={80}
          required
        />
        {fieldErrors.customerName && (
          <p id="checkout-name-error" className="text-sm text-destructive">
            {fieldErrors.customerName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkout-phone">Teléfono / WhatsApp</Label>
        <Input
          id="checkout-phone"
          name="customerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="987 654 321"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={Boolean(fieldErrors.customerPhone)}
          aria-describedby={fieldErrors.customerPhone ? 'checkout-phone-error' : undefined}
          className="h-11 bg-background text-base"
          maxLength={20}
          required
        />
        {fieldErrors.customerPhone && (
          <p id="checkout-phone-error" className="text-sm text-destructive">
            {fieldErrors.customerPhone}
          </p>
        )}
      </div>

      {formError && (
        <div role="alert" className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p>{formError}</p>
            {stockNotes.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {stockNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
