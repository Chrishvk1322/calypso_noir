/** 45 → "S/. 45.00" (formato usado por la tienda y en la plantilla de WhatsApp). */
export const formatPrice = (amount: number): string => `S/. ${amount.toFixed(2)}`

/** Lee `?page=` y devuelve un entero ≥ 1 (cualquier valor inválido → 1). */
export const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/** Fecha y hora en Lima con el mismo formato del admin: "03/10/2026 - 11:56 AM". */
export const formatDateTime = (value: string | number | Date): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  )
  return `${parts.day}/${parts.month}/${parts.year} - ${parts.hour}:${parts.minute} ${parts.dayPeriod}`
}
