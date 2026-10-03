/**
 * Datos de muestra para desarrollo (imágenes ilustradas generadas con sharp, sin fotos externas).
 *
 *   pnpm seed           → solo si la base no tiene colecciones
 *   pnpm seed:reset     → borra pedidos, slides, productos, colecciones e imágenes y vuelve a sembrar
 *
 * Nunca toca la colección `users`, y en la configuración del sitio solo completa campos vacíos.
 */
import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '@/payload.config'

// `payload run` no reenvía argumentos al script, por eso se usa una variable de entorno.
const reset = process.env.SEED_RESET === '1'

type Shape = 'arch' | 'drop' | 'circle' | 'moon' | 'leaf' | 'rect' | 'flower'
type Kind = 'Aretes' | 'Collar' | 'Broche' | 'Anillo'

type CollectionDef = {
  title: string
  description: string
  /** Color principal de la arcilla, acento y fondo de la foto de producto. */
  clay: string
  accent: string
  backdrop: string
  marble?: boolean
  products: [kind: Kind, shape: Shape, name: string, price: number, stock: number][]
}

// En orden de creación: la última es la "más reciente" en el feed.
const COLLECTIONS: CollectionDef[] = [
  {
    title: 'Mármol Crema',
    description: 'Piezas minimalistas con efecto mármol sobre fondo crema.',
    clay: '#e9e1cf', accent: '#8d8577', backdrop: '#d9d2c1', marble: true,
    products: [
      ['Aretes', 'drop', 'Gota Mármol', 36, 9],
      ['Collar', 'circle', 'Círculo Mármol', 58, 1],
      ['Aretes', 'rect', 'Rectángulo Mármol', 34, 7],
    ],
  },
  {
    title: 'Luna Terracota',
    description: 'Formas orgánicas inspiradas en la luna y la arcilla cocida.',
    clay: '#a0583c', accent: '#e7c9a9', backdrop: '#efe2d0',
    products: [
      ['Aretes', 'moon', 'Media Luna', 42, 10],
      ['Collar', 'circle', 'Eclipse', 75, 2],
      ['Aretes', 'arch', 'Arco Terracota', 40, 6],
      ['Anillo', 'circle', 'Fases', 30, 4],
    ],
  },
  {
    title: 'Noir Botánico',
    description: 'Hojas y flores modeladas a mano en tonos tierra y negro.',
    clay: '#1f2a22', accent: '#8a9b72', backdrop: '#e4e6d6',
    products: [
      ['Aretes', 'leaf', 'Hoja de Monstera', 45, 8],
      ['Collar', 'flower', 'Flor Seca', 60, 3],
      ['Aretes', 'leaf', 'Helecho', 38, 0],
      ['Broche', 'flower', 'Margarita', 30, 12],
      ['Anillo', 'leaf', 'Brote', 28, 5],
    ],
  },
  {
    title: 'Arcos de Arena',
    description: 'Arcos superpuestos en tonos arena, inspirados en el desierto costero.',
    clay: '#c79a6b', accent: '#f3e3cc', backdrop: '#f1e7d8',
    products: [
      ['Aretes', 'arch', 'Arco Duna', 39, 11],
      ['Aretes', 'arch', 'Arco Doble', 44, 5],
      ['Collar', 'arch', 'Horizonte', 62, 3],
      ['Broche', 'arch', 'Atardecer', 29, 8],
    ],
  },
  {
    title: 'Medianoche',
    description: 'Negro profundo con destellos dorados para las noches especiales.',
    clay: '#1c1c2b', accent: '#c8a45a', backdrop: '#dcdad3',
    products: [
      ['Aretes', 'drop', 'Gota Nocturna', 48, 6],
      ['Aretes', 'moon', 'Luna Nueva', 46, 0],
      ['Collar', 'drop', 'Constelación', 79, 2],
      ['Anillo', 'circle', 'Órbita', 32, 9],
    ],
  },
  {
    title: 'Jardín Rosa',
    description: 'Flores suaves en rosa empolvado para el día a día.',
    clay: '#c98b8b', accent: '#f6dede', backdrop: '#f4e6e1',
    products: [
      ['Aretes', 'flower', 'Peonía', 41, 7],
      ['Broche', 'flower', 'Rosa Silvestre', 33, 10],
      ['Aretes', 'drop', 'Pétalo', 37, 4],
    ],
  },
  {
    title: 'Océano Profundo',
    description: 'Azules y verdes del Pacífico en formas de agua.',
    clay: '#2f5d62', accent: '#a7c4bc', backdrop: '#e0e7e2',
    products: [
      ['Aretes', 'drop', 'Ola', 43, 8],
      ['Collar', 'circle', 'Perla de Mar', 66, 3],
      ['Aretes', 'arch', 'Marea', 40, 6],
      ['Anillo', 'drop', 'Rocío', 29, 0],
      ['Broche', 'circle', 'Burbuja', 27, 12],
    ],
  },
  {
    title: 'Otoño Mostaza',
    description: 'La calidez del otoño en mostaza, canela y ocre.',
    clay: '#c08a2e', accent: '#f0d9a8', backdrop: '#f3e8d4',
    products: [
      ['Aretes', 'leaf', 'Hoja Caída', 38, 9],
      ['Aretes', 'rect', 'Canela', 35, 5],
      ['Collar', 'leaf', 'Bosque', 59, 2],
    ],
  },
  {
    title: 'Lavanda Suave',
    description: 'Lilas delicados y formas redondeadas.',
    clay: '#9b8bb4', accent: '#e6def2', backdrop: '#ece8ef',
    products: [
      ['Aretes', 'circle', 'Lavanda', 36, 10],
      ['Aretes', 'drop', 'Lila', 38, 4],
      ['Anillo', 'flower', 'Violeta', 31, 7],
      ['Collar', 'moon', 'Crepúsculo', 64, 1],
    ],
  },
  {
    title: 'Geometría Noir',
    description: 'Líneas puras en blanco y negro para un estilo contemporáneo.',
    clay: '#111111', accent: '#feffee', backdrop: '#e7e6dc',
    products: [
      ['Aretes', 'rect', 'Bloque', 39, 8],
      ['Aretes', 'arch', 'Portal', 42, 6],
      ['Collar', 'rect', 'Monolito', 68, 3],
      ['Broche', 'circle', 'Punto', 26, 15],
    ],
  },
  {
    title: 'Cerezo',
    description: 'Rojo cereza y flores de primavera.',
    clay: '#8e2f3c', accent: '#f2c4c8', backdrop: '#f3e2df',
    products: [
      ['Aretes', 'flower', 'Flor de Cerezo', 44, 7],
      ['Aretes', 'drop', 'Cereza', 37, 0],
      ['Collar', 'flower', 'Sakura', 70, 2],
      ['Anillo', 'circle', 'Brote Rojo', 30, 6],
    ],
  },
  {
    title: 'Verano Cítrico',
    description: 'Amarillos luminosos y formas solares para el verano.',
    clay: '#d9a441', accent: '#fff1c9', backdrop: '#f7eed6',
    products: [
      ['Aretes', 'circle', 'Sol', 40, 12],
      ['Aretes', 'arch', 'Rayo', 38, 6],
      ['Collar', 'circle', 'Mediodía', 63, 4],
      ['Broche', 'flower', 'Girasol', 32, 9],
      ['Aretes', 'moon', 'Limón', 35, 5],
    ],
  },
]

// Las tres colecciones más recientes se destacan en el carrusel.
const HERO_TITLES = ['Verano Cítrico', 'Noir Botánico', 'Medianoche']

// ---------- Ilustraciones SVG ----------

const SHAPE_PATHS: Record<Shape, string> = {
  arch: 'M -120 70 A 120 120 0 0 1 120 70 L 72 70 A 72 72 0 0 0 -72 70 Z',
  drop: 'M 0 -150 C 85 -45 110 25 110 65 A 110 110 0 0 1 -110 65 C -110 25 -85 -45 0 -150 Z',
  circle: 'M -115 0 A 115 115 0 1 0 115 0 A 115 115 0 1 0 -115 0 Z',
  moon: 'M 30 -140 A 145 145 0 1 0 30 140 A 115 115 0 1 1 30 -140 Z',
  leaf: 'M 0 -160 C 115 -80 115 80 0 160 C -115 80 -115 -80 0 -160 Z',
  rect: 'M -80 -125 H 80 A 22 22 0 0 1 102 -103 V 103 A 22 22 0 0 1 80 125 H -80 A 22 22 0 0 1 -102 103 V -103 A 22 22 0 0 1 -80 -125 Z',
  flower: [0, 72, 144, 216, 288]
    .map((deg) => {
      const r = (deg * Math.PI) / 180
      const x = Math.round(Math.sin(r) * 62)
      const y = Math.round(-Math.cos(r) * 62)
      return `M ${x - 58} ${y} A 58 58 0 1 0 ${x + 58} ${y} A 58 58 0 1 0 ${x - 58} ${y} Z`
    })
    .join(' '),
}

const defs = (id: string) => `
  <defs>
    <filter id="grain-${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.08"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="multiply"/>
    </filter>
    <filter id="marble-${id}">
      <feTurbulence type="turbulence" baseFrequency="0.012 0.03" numOctaves="3" seed="3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.42  0 0 0 0 0.38  0 0 0 -2.2 1.1"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <radialGradient id="shade-${id}" cx="35%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
    </radialGradient>
    <filter id="shadow-${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>`

/** Una pieza de arcilla (forma + brillo + textura opcional) centrada en (x, y). */
const piece = (id: string, def: CollectionDef, shape: Shape, x: number, y: number, scale: number, rotate = 0) => `
  <g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" filter="url(#shadow-${id})">
    <path d="${SHAPE_PATHS[shape]}" fill="${def.clay}"/>
    ${def.marble ? `<path d="${SHAPE_PATHS[shape]}" fill="${def.clay}" filter="url(#marble-${id})"/>` : ''}
    <path d="${SHAPE_PATHS[shape]}" fill="url(#shade-${id})"/>
    ${shape === 'leaf' ? `<path d="M 0 -140 C 10 -40 10 40 0 140" stroke="${def.accent}" stroke-width="6" fill="none" opacity="0.7"/>` : ''}
    ${shape === 'flower' ? `<circle r="34" fill="${def.accent}"/>` : ''}
  </g>`

const GOLD = '#c8a45a'

/** Aretes: dos piezas con gancho dorado. */
const earrings = (id: string, def: CollectionDef, shape: Shape, w: number, h: number) =>
  [w * 0.34, w * 0.66]
    .map((x) => {
      const top = h * 0.27
      return `
        <path d="M ${x} ${top - 70} q 34 -40 0 -80" stroke="${GOLD}" stroke-width="7" fill="none" stroke-linecap="round"/>
        <circle cx="${x}" cy="${top - 40}" r="16" fill="${GOLD}"/>
        <line x1="${x}" y1="${top - 30}" x2="${x}" y2="${h * 0.5 - 200}" stroke="${GOLD}" stroke-width="6"/>
        ${piece(id, def, shape, x, h * 0.5, 1.95)}`
    })
    .join('')

/** Collar: cadena curva con un dije. */
const necklace = (id: string, def: CollectionDef, shape: Shape, w: number, h: number) => `
  <path d="M ${w * 0.12} ${h * 0.05} Q ${w / 2} ${h * 0.95} ${w * 0.88} ${h * 0.05}" stroke="${GOLD}" stroke-width="7" fill="none"/>
  ${piece(id, def, shape, w / 2, h * 0.6, 2.3)}`

/** Broche: pieza grande con una pieza pequeña en acento. */
const brooch = (id: string, def: CollectionDef, shape: Shape, w: number, h: number) => `
  ${piece(id, def, shape, w * 0.5, h * 0.47, 3, -12)}
  ${piece(id, { ...def, clay: def.accent }, 'circle', w * 0.74, h * 0.7, 0.6)}`

/** Anillo: aro dorado con la pieza encima. */
const ring = (id: string, def: CollectionDef, shape: Shape, w: number, h: number) => `
  <ellipse cx="${w / 2}" cy="${h * 0.66}" rx="${w * 0.24}" ry="${w * 0.24}" stroke="${GOLD}" stroke-width="34" fill="none"/>
  ${piece(id, def, shape, w / 2, h * 0.38, 1.7)}`

const RENDER: Record<Kind, typeof earrings> = { Aretes: earrings, Collar: necklace, Broche: brooch, Anillo: ring }

const toJpeg = async (svg: string, name: string) => {
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toBuffer()
  return { data, mimetype: 'image/jpeg', name, size: data.length }
}

const fileName = (text: string) =>
  `${text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`

/** Foto de producto 1600×2000 (4:5, igual que las tarjetas). */
const productImage = (def: CollectionDef, kind: Kind, shape: Shape, name: string, variant = 0) => {
  const w = 1600
  const h = 2000
  const id = `p${variant}`
  const bg = variant === 0 ? def.backdrop : def.accent
  return toJpeg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      ${defs(id)}
      <g filter="url(#grain-${id})">
        <rect width="100%" height="100%" fill="${bg}"/>
        <ellipse cx="${w / 2}" cy="${h * 0.88}" rx="${w * 0.36}" ry="50" fill="#000" opacity="0.04"/>
        ${RENDER[kind](id, def, shape, w, h)}
      </g>
    </svg>`,
    fileName(`${kind} ${name} ${variant + 1}`),
  )
}

/** Portada / slide 1920×1080: fondo oscuro con piezas a la derecha (el texto va a la izquierda). */
const coverImage = (def: CollectionDef, shapes: Shape[]) => {
  const w = 1920
  const h = 1080
  const id = 'c'
  const pieces = [
    [1350, 420, 2.1, -8],
    [1650, 760, 1.4, 14],
    [1080, 820, 1.1, 22],
    [1700, 250, 0.9, -20],
  ]
  return toJpeg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      ${defs(id)}
      <g filter="url(#grain-${id})">
        <rect width="100%" height="100%" fill="${def.backdrop}"/>
        <circle cx="${w * 0.72}" cy="${h * 0.5}" r="${h * 0.62}" fill="${def.accent}" opacity="0.55"/>
        ${pieces.map(([x, y, s, r], i) => piece(id, def, shapes[i % shapes.length], x, y, s, r)).join('')}
      </g>
    </svg>`,
    fileName(`portada ${def.title}`),
  )
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

// ---------- Siembra ----------

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
  payload.logger.info('Datos anteriores eliminados (usuarios y configuración intactos).')
}

const created = new Map<string, { id: number; coverId: number }>()
let productCount = 0

for (const def of COLLECTIONS) {
  const cover = await payload.create({
    collection: 'media',
    data: { alt: `Piezas de la colección ${def.title}` },
    file: await coverImage(def, [...new Set(def.products.map((p) => p[1]))]),
  })
  const collection = await payload.create({
    collection: 'collections',
    data: { title: def.title, description: def.description, coverImage: cover.id },
  })
  created.set(def.title, { id: collection.id, coverId: cover.id })

  for (const [kind, shape, name, price, stock] of def.products) {
    const fullName = `${kind} ${name}`
    const images = []
    for (const variant of [0, 1]) {
      const image = await payload.create({
        collection: 'media',
        data: { alt: `${fullName}${variant ? ' (detalle)' : ''}` },
        file: await productImage(def, kind, shape, name, variant),
      })
      images.push(image.id)
    }
    await payload.create({
      collection: 'products',
      data: {
        name: fullName,
        price,
        stock,
        collection: collection.id,
        images,
        description: paragraph(
          `${fullName}: pieza única modelada a mano en arcilla polimérica, de la colección ${def.title}. Ligera, resistente y con acabado sellado.`,
        ),
      },
    })
    productCount++
  }
}

// Contenido oculto para comprobar que el público no lo ve.
const firstCollection = created.get(COLLECTIONS[0].title)!
await payload.create({
  collection: 'products',
  data: { name: 'Prototipo oculto', price: 1, stock: 1, collection: firstCollection.id, active: false },
})
await payload.create({
  collection: 'collections',
  data: { title: 'Colección borrador', description: 'No debería verse en la tienda.', active: false },
})

for (const [index, title] of HERO_TITLES.entries()) {
  const def = COLLECTIONS.find((c) => c.title === title)!
  const target = created.get(title)!
  await payload.create({
    collection: 'hero-slides',
    data: {
      title: def.title,
      subtitle: def.description,
      image: target.coverId,
      collectionLink: target.id,
      order: index + 1,
    },
  })
}

// Configuración del sitio: solo completa lo que esté vacío, para no pisar cambios del admin.
const site = await payload.findGlobal({ slug: 'site-config' })
const defaults = {
  contactEmail: 'hola@calypsonoir.pe',
  whatsappNumber: '51999999999',
  tiktokUrl: 'https://www.tiktok.com/@calypsonoir',
  instagramUrl: 'https://www.instagram.com/calypsonoir',
} as const
const missing = Object.fromEntries(
  Object.entries(defaults).filter(([key]) => !site[key as keyof typeof defaults]),
)
await payload.updateGlobal({
  slug: 'site-config',
  data: {
    ...missing,
    ...(site.aboutUsText
      ? {}
      : { aboutUsText: paragraph('Calypso Noir nace del amor por la arcilla polimérica y las piezas hechas a mano.') }),
  },
})

payload.logger.info(
  `Seed listo: ${COLLECTIONS.length} colecciones activas (+1 borrador), ${productCount} productos (+1 oculto), ${HERO_TITLES.length} slides.`,
)
process.exit(0)
