import { readFileSync } from 'fs'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { formatDateTime } from '@/lib/format'
import { buildReceiptPdf, type ReceiptData } from '@/lib/receipt'

const base: ReceiptData = {
  orderCode: '#PED-5364',
  customerName: 'Ana Pérez Ñahui',
  customerPhone: '51987654321',
  saleDate: '2026-10-03T16:56:00.000Z',
  items: [
    { name: 'Aretes Media Luna', quantity: 2, unitPrice: 42 },
    { name: 'Collar Eclipse', quantity: 1, unitPrice: 75 },
  ],
  totalAmount: 159,
  message: '¡Gracias por tu compra! ¿Nos dejas tu opinión?',
  store: {
    whatsappNumber: '51964588065',
    contactEmail: 'hola@calypsonoir.pe',
    instagramUrl: 'https://www.instagram.com/calypsonoir',
  },
  logo: readFileSync('public/assets/logo.jpg'),
}

describe('formatDateTime', () => {
  it('usa dd/mm/aaaa - hh:mm AM/PM en hora de Lima', () => {
    expect(formatDateTime('2026-10-03T16:56:00.000Z')).toBe('03/10/2026 - 11:56 AM')
    expect(formatDateTime('2026-12-31T23:05:00.000Z')).toBe('31/12/2026 - 06:05 PM')
  })
})

describe('Boleta de compra (PDF)', () => {
  it('genera un PDF A4 de una página con título y metadatos', async () => {
    const bytes = await buildReceiptPdf(base)
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe('%PDF-')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(1)
    expect(pdf.getTitle()).toBe('Boleta de compra #PED-5364 · Calypso Noir')
    const { width, height } = pdf.getPage(0).getSize()
    expect([Math.round(width), Math.round(height)]).toEqual([595, 842])
  })

  it('no se rompe con emojis ni caracteres que la fuente no soporta', async () => {
    const bytes = await buildReceiptPdf({
      ...base,
      customerName: 'Lucía 🌸',
      items: [{ name: 'Aretes ✨ Luna 🌙', quantity: 1, unitPrice: 40 }],
      message: '¡Gracias! 💖 Vuelve pronto 😊',
    })
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })

  it('agrega páginas cuando hay muchos productos', async () => {
    const items = Array.from({ length: 45 }, (_, i) => ({
      name: `Producto de prueba con un nombre bastante largo número ${i + 1}`,
      quantity: 1,
      unitPrice: 10,
    }))
    const bytes = await buildReceiptPdf({ ...base, items, totalAmount: 450 })
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(1)
  })

  it('funciona sin logo ni mensaje (usa el mensaje por defecto)', async () => {
    const bytes = await buildReceiptPdf({ ...base, logo: null, message: null })
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1)
  })
})
