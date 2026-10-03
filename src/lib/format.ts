/** 45 → "S/. 45.00" (formato usado por la tienda y en la plantilla de WhatsApp). */
export const formatPrice = (amount: number): string => `S/. ${amount.toFixed(2)}`

/** Lee `?page=` y devuelve un entero ≥ 1 (cualquier valor inválido → 1). */
export const parsePage = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number(raw)
  return Number.isInteger(page) && page >= 1 ? page : 1
}
