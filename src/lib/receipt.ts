import { type PDFFont, type PDFPage, PDFDocument, rgb, StandardFonts } from 'pdf-lib'

import { formatDateTime, formatPrice } from '@/lib/format'
import { formatPhone } from '@/lib/whatsapp'

export const DEFAULT_RECEIPT_MESSAGE =
  '¡Gracias por tu compra! Cada pieza fue modelada a mano con mucho cariño. Si tienes alguna consulta sobre tu pedido, escríbenos por WhatsApp.'

export type ReceiptData = {
  orderCode: string
  customerName: string
  customerPhone: string
  /** Fecha en que se finalizó la venta (o la del pedido si no se registró). */
  saleDate: string | Date
  items: { name: string; quantity: number; unitPrice: number }[]
  totalAmount: number
  message?: string | null
  store: {
    whatsappNumber?: string | null
    contactEmail?: string | null
    instagramUrl?: string | null
  }
  /** Logo en JPG (opcional). */
  logo?: Uint8Array | null
}

// Paleta de la tienda.
const INK = rgb(0.067, 0.067, 0.067) // #111111
const MUTED = rgb(0.36, 0.36, 0.33) // #5c5c55
const CREAM = rgb(0.996, 1, 0.933) // #FEFFEE
const LINE = rgb(0.89, 0.894, 0.81) // #e3e4cf

const PAGE = { width: 595.28, height: 841.89 } // A4
const MARGIN = 48

/**
 * Las fuentes estándar de PDF usan WinAnsi: cubren acentos, ñ, ¡ y ¿, pero no emojis ni otros
 * símbolos. Se quitan los caracteres que no se pueden codificar para no romper la boleta.
 */
const safe = (font: PDFFont, text: string) =>
  [...text.replace(/\r/g, '')]
    .filter((char) => {
      if (char === '\n') return true
      try {
        font.encodeText(char)
        return true
      } catch {
        return false
      }
    })
    .join('')

/** Parte un texto en líneas que entren en `maxWidth`. */
const wrap = (font: PDFFont, text: string, size: number, maxWidth: number): string[] => {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
      } else {
        if (line) lines.push(line)
        line = word
      }
    }
    lines.push(line)
  }
  return lines
}

/** Genera la boleta de compra de un pedido finalizado (PDF A4). */
export async function buildReceiptPdf(data: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Boleta de compra ${data.orderCode} · Calypso Noir`)
  pdf.setAuthor('Calypso Noir')
  pdf.setCreator('Calypso Noir')
  pdf.setLanguage('es-PE')

  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const sans = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const logo = data.logo ? await pdf.embedJpg(data.logo).catch(() => null) : null

  const right = PAGE.width - MARGIN
  let page: PDFPage = pdf.addPage([PAGE.width, PAGE.height])
  let y = PAGE.height - MARGIN

  const text = (value: string, x: number, size: number, font: PDFFont = sans, color = INK) =>
    page.drawText(safe(font, value), { x, y, size, font, color })
  const textRight = (value: string, size: number, font: PDFFont = sans, color = INK, edge = right) => {
    const clean = safe(font, value)
    page.drawText(clean, { x: edge - font.widthOfTextAtSize(clean, size), y, size, font, color })
  }
  const rule = (thickness = 0.75, color = LINE) =>
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness, color })

  // Encabezado: franja crema con logo, marca y datos de la boleta.
  const bandHeight = 92
  page.drawRectangle({ x: 0, y: PAGE.height - bandHeight - 24, width: PAGE.width, height: bandHeight + 24, color: CREAM })
  y = PAGE.height - 40 - 52
  if (logo) page.drawImage(logo, { x: MARGIN, y, width: 52, height: 52 })
  const brandX = logo ? MARGIN + 66 : MARGIN
  y += 26
  text('Calypso Noir', brandX, 24, serif)
  y -= 18
  text('Piezas hechas a mano en arcilla polimérica', brandX, 9, sans, MUTED)

  y = PAGE.height - 40 - 14
  textRight('BOLETA DE COMPRA', 11, bold)
  y -= 18
  textRight(data.orderCode, 16, serif)
  y -= 16
  textRight(formatDateTime(data.saleDate), 9, sans, MUTED)

  // Cliente.
  y = PAGE.height - bandHeight - 24 - 36
  text('CLIENTE', MARGIN, 8, bold, MUTED)
  y -= 16
  text(data.customerName, MARGIN, 12)
  y -= 15
  text(formatPhone(data.customerPhone) || data.customerPhone, MARGIN, 10, sans, MUTED)

  // Tabla de productos.
  const cols = { qty: right - 200, unit: right - 100, amount: right }
  y -= 34
  text('PRODUCTO', MARGIN, 8, bold, MUTED)
  textRight('CANT.', 8, bold, MUTED, cols.qty)
  textRight('P. UNIT.', 8, bold, MUTED, cols.unit)
  textRight('IMPORTE', 8, bold, MUTED, cols.amount)
  y -= 8
  rule(1, INK)

  const nameWidth = cols.qty - 50 - MARGIN
  for (const item of data.items) {
    const lines = wrap(sans, safe(sans, item.name), 10, nameWidth)
    const rowHeight = 14 * lines.length + 12
    if (y - rowHeight < MARGIN + 160) {
      page = pdf.addPage([PAGE.width, PAGE.height])
      y = PAGE.height - MARGIN
    }
    y -= 18
    textRight(String(item.quantity), 10, sans, INK, cols.qty)
    textRight(formatPrice(item.unitPrice), 10, sans, INK, cols.unit)
    textRight(formatPrice(item.unitPrice * item.quantity), 10, sans, INK, cols.amount)
    for (const [index, line] of lines.entries()) {
      if (index > 0) y -= 14
      text(line, MARGIN, 10)
    }
    y -= 10
    rule()
  }

  // Total.
  y -= 24
  textRight(formatPrice(data.totalAmount), 16, bold, INK)
  textRight('TOTAL', 9, bold, MUTED, cols.unit)

  // Mensaje para el cliente.
  const message = (data.message?.trim() || DEFAULT_RECEIPT_MESSAGE).slice(0, 1200)
  const messageLines = wrap(serif, safe(serif, message), 13, right - MARGIN - 32)
  const boxHeight = messageLines.length * 18 + 28
  if (y - boxHeight - 40 < MARGIN + 50) {
    page = pdf.addPage([PAGE.width, PAGE.height])
    y = PAGE.height - MARGIN
  }
  y -= 40 + boxHeight
  page.drawRectangle({ x: MARGIN, y, width: right - MARGIN, height: boxHeight, color: CREAM, borderColor: LINE, borderWidth: 0.75 })
  y += boxHeight - 26
  for (const line of messageLines) {
    text(line, MARGIN + 16, 13, serif)
    y -= 18
  }

  // Pie: datos de contacto en la primera página.
  const contact = [
    'Enviamos a todo el Perú',
    data.store.whatsappNumber ? `WhatsApp ${formatPhone(data.store.whatsappNumber)}` : null,
    data.store.contactEmail,
    data.store.instagramUrl?.replace(/^https?:\/\/(www\.)?/, ''),
  ]
    .filter(Boolean)
    .join('   ·   ')
  const first = pdf.getPage(0)
  const footer = safe(sans, contact)
  first.drawLine({ start: { x: MARGIN, y: MARGIN + 18 }, end: { x: right, y: MARGIN + 18 }, thickness: 0.75, color: LINE })
  first.drawText(footer, {
    x: (PAGE.width - sans.widthOfTextAtSize(footer, 8.5)) / 2,
    y: MARGIN,
    size: 8.5,
    font: sans,
    color: MUTED,
  })

  return pdf.save()
}
