import { describe, expect, it } from 'vitest'

import { buildWhatsAppUrl, fillTemplate, normalizePhone } from '@/lib/whatsapp'

describe('normalizePhone', () => {
  it('deja solo dígitos', () => {
    expect(normalizePhone('+51 987-654-321')).toBe('51987654321')
    expect(normalizePhone('(51) 987 654 321')).toBe('51987654321')
  })

  it('tolera valores vacíos', () => {
    expect(normalizePhone(null)).toBe('')
    expect(normalizePhone(undefined)).toBe('')
  })
})

describe('buildWhatsAppUrl', () => {
  it('arma la URL wa.me con el mensaje codificado', () => {
    expect(buildWhatsAppUrl('51964588065', '¡Hola! Me gustaría pedir un diseño personalizado.')).toBe(
      'https://wa.me/51964588065?text=%C2%A1Hola!%20Me%20gustar%C3%ADa%20pedir%20un%20dise%C3%B1o%20personalizado.',
    )
  })

  it('codifica caracteres reservados (&, #, ?, saltos de línea)', () => {
    const url = buildWhatsAppUrl('51964588065', 'Pedido #PED-1234 & total?\nGracias')!
    const text = new URL(url).searchParams.get('text')
    expect(text).toBe('Pedido #PED-1234 & total?\nGracias')
    expect(url).not.toContain('#')
  })

  it('sanea el número', () => {
    expect(buildWhatsAppUrl('+51 964 588 065', 'Hola')).toBe('https://wa.me/51964588065?text=Hola')
  })

  it('omite el texto si el mensaje está vacío', () => {
    expect(buildWhatsAppUrl('51964588065', '   ')).toBe('https://wa.me/51964588065')
    expect(buildWhatsAppUrl('51964588065')).toBe('https://wa.me/51964588065')
  })

  it('devuelve null sin número', () => {
    expect(buildWhatsAppUrl('', 'Hola')).toBeNull()
    expect(buildWhatsAppUrl(null, 'Hola')).toBeNull()
  })
})

describe('fillTemplate', () => {
  it('reemplaza las variables conocidas', () => {
    expect(
      fillTemplate('Pedido {orderCode} por S/.{totalAmount}', { orderCode: '#PED-8492', totalAmount: '120.00' }),
    ).toBe('Pedido #PED-8492 por S/.120.00')
  })

  it('reemplaza todas las apariciones y deja visibles las desconocidas', () => {
    expect(fillTemplate('{a} {a} {b}', { a: 1 })).toBe('1 1 {b}')
  })
})
