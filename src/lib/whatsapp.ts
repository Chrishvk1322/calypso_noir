/** Deja solo dígitos: "+51 987-654-321" → "51987654321". */
export const normalizePhone = (phone: string | null | undefined): string =>
  (phone ?? '').replace(/\D/g, '')

/**
 * Reemplaza variables `{nombre}` de una plantilla. Las variables sin valor se dejan tal cual
 * para que un error de configuración sea visible en lugar de desaparecer en silencio.
 */
export const fillTemplate = (
  template: string,
  vars: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  )

/** URL de chat directo `https://wa.me/<número>?text=<mensaje>`, o `null` si no hay número. */
export const buildWhatsAppUrl = (
  phone: string | null | undefined,
  message?: string | null,
): string | null => {
  const number = normalizePhone(phone)
  if (!number) return null
  const base = `https://wa.me/${number}`
  return message?.trim() ? `${base}?text=${encodeURIComponent(message.trim())}` : base
}

/** "51964588065" → "+51 964 588 065" (formato peruano); otros números: "+" y dígitos. */
export const formatPhone = (phone: string | null | undefined): string => {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  const peru = digits.match(/^51(9\d{2})(\d{3})(\d{3})$/)
  if (peru) return `+51 ${peru[1]} ${peru[2]} ${peru[3]}`
  return `+${digits}`
}

/** "https://www.instagram.com/calypsonoir/" → "@calypsonoir" (null si no hay usuario). */
export const socialHandle = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    const segment = new URL(url).pathname.split('/').find(Boolean)
    return segment ? `@${segment.replace(/^@/, '')}` : null
  } catch {
    return null
  }
}
