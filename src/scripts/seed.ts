/**
 * Datos de muestra para desarrollo.
 *
 *   pnpm seed           → solo si la base no tiene colecciones
 *   pnpm seed:reset     → borra pedidos, slides, productos, colecciones e imágenes y vuelve a sembrar
 *
 * Nunca toca la colección `users`.
 */
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '@/payload.config'

// `payload run` no reenvía argumentos al script, por eso se usa una variable de entorno.
const reset = process.env.SEED_RESET === '1'

const COLLECTIONS = [
  {
    title: 'Noir Botánico',
    description: 'Hojas y flores modeladas a mano en tonos tierra y negro.',
    color: '#3f4a3c',
    products: [
      ['Aretes Hoja de Monstera', 45, 8],
      ['Collar Flor Seca', 60, 3],
      ['Aretes Helecho', 38, 0],
      ['Broche Margarita', 30, 12],
      ['Anillo Brote', 28, 5],
    ],
  },
  {
    title: 'Luna Terracota',
    description: 'Formas orgánicas inspiradas en la luna y la arcilla cocida.',
    color: '#a0583c',
    products: [
      ['Aretes Media Luna', 42, 10],
      ['Collar Eclipse', 75, 2],
      ['Aretes Arco Terracota', 40, 6],
      ['Pulsera Fases', 55, 4],
    ],
  },
  {
    title: 'Mármol Crema',
    description: 'Piezas minimalistas con efecto mármol sobre fondo crema.',
    color: '#c9bfa6',
    products: [
      ['Aretes Gota Mármol', 36, 9],
      ['Collar Círculo Mármol', 58, 1],
      ['Aretes Rectángulo', 34, 7],
    ],
  },
] as const

const placeholderImage = async (label: string, color: string, width = 1600, height = 1600) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${color}"/>
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="#feffee" opacity="0.18"/>
      <text x="50%" y="50%" font-family="Georgia, serif" font-size="${Math.round(width / 18)}"
        fill="#feffee" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
  const name = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`
  return { data, mimetype: 'image/jpeg', name, size: data.length }
}

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
        textFormat: 0,
        children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  },
})

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'collections' })
if (existing.totalDocs > 0 && !reset) {
  payload.logger.warn('La base ya tiene colecciones. Usa "pnpm seed:reset" para volver a sembrar.')
  process.exit(0)
}

if (reset) {
  for (const slug of ['orders', 'hero-slides', 'products', 'collections', 'media'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
  payload.logger.info('Datos anteriores eliminados (usuarios intactos).')
}

const createdCollections = []
for (const [index, def] of COLLECTIONS.entries()) {
  const cover = await payload.create({
    collection: 'media',
    data: { alt: `Portada de ${def.title}` },
    file: await placeholderImage(def.title, def.color, 1920, 1080),
  })
  const collection = await payload.create({
    collection: 'collections',
    data: { title: def.title, description: def.description, coverImage: cover.id },
  })
  createdCollections.push(collection)

  for (const [name, price, stock] of def.products) {
    const image = await payload.create({
      collection: 'media',
      data: { alt: name },
      file: await placeholderImage(name, def.color),
    })
    await payload.create({
      collection: 'products',
      data: {
        name,
        price,
        stock,
        collection: collection.id,
        images: [image.id],
        description: paragraph(`${name}: pieza única hecha a mano en arcilla polimérica.`),
      },
    })
  }

  await payload.create({
    collection: 'hero-slides',
    data: {
      title: def.title,
      subtitle: def.description,
      image: cover.id,
      collectionLink: collection.id,
      order: index + 1,
    },
  })
}

// Un producto inactivo para comprobar que no se muestra al público.
await payload.create({
  collection: 'products',
  data: { name: 'Prototipo oculto', price: 1, stock: 1, collection: createdCollections[0].id, active: false },
})

await payload.updateGlobal({
  slug: 'site-config',
  data: {
    contactEmail: 'hola@calypsonoir.pe',
    whatsappNumber: '51999999999',
    tiktokUrl: 'https://www.tiktok.com/@calypsonoir',
    instagramUrl: 'https://www.instagram.com/calypsonoir',
    aboutUsText: paragraph('Calypso Noir nace del amor por la arcilla polimérica y las piezas hechas a mano.'),
  },
})

payload.logger.info(
  `Seed listo: ${COLLECTIONS.length} colecciones, ${COLLECTIONS.reduce((n, c) => n + c.products.length, 0) + 1} productos, ${COLLECTIONS.length} slides.`,
)
process.exit(0)
