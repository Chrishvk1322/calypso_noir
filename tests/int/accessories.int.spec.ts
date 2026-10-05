import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import sitemap from '@/app/sitemap'
import { getPayloadClient } from '@/lib/payload'
import { getAccessoryProducts, getAccessoryTypeBySlug, getAccessoryTypes } from '@/lib/queries'
import type { AccessoryType, Product, User } from '@/payload-types'

let payload: Payload
let admin: User
let collectionId: number
let hiddenCollectionId: number
let aretes: AccessoryType
let collares: AccessoryType
let inactive: AccessoryType
let legacy: Product // creado sin tipo (como los productos anteriores a la 8.7)

const QA_EMAIL = 'qa-accesorios@calypso.test'

const cleanDatabase = async () => {
  for (const slug of ['orders', 'products', 'accessory-types', 'collections'] as const) {
    await payload.delete({ collection: slug, where: { id: { exists: true } } })
  }
  await payload.delete({ collection: 'users', where: { email: { equals: QA_EMAIL } } })
}

const createProduct = (data: Partial<Product> & { name: string }, asAdmin = false) =>
  payload.create({
    collection: 'products',
    data: { price: 30, stock: 3, collection: collectionId, ...data },
    depth: 0,
    ...(asAdmin ? { user: admin } : {}),
  })

describe('Mejora 8.7: tipos de accesorio', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
    await cleanDatabase()
    admin = await payload.create({ collection: 'users', data: { email: QA_EMAIL, password: 'QaAccesorios-8.7!' } })
    collectionId = (await payload.create({ collection: 'collections', data: { title: 'Colección QA' } })).id
    hiddenCollectionId = (
      await payload.create({ collection: 'collections', data: { title: 'Colección oculta', active: false } })
    ).id

    collares = await payload.create({ collection: 'accessory-types', data: { title: 'Collares', order: 2 } })
    aretes = await payload.create({ collection: 'accessory-types', data: { title: 'Aretes', order: 1 } })
    inactive = await payload.create({ collection: 'accessory-types', data: { title: 'Broches', active: false } })
    legacy = await createProduct({ name: 'Producto sin tipo' })
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('colección', () => {
    it('autogenera el slug y queda activa por defecto', () => {
      expect(aretes).toMatchObject({ slug: 'aretes', active: true })
    })

    it('el público solo ve los tipos activos', async () => {
      const { docs } = await payload.find({ collection: 'accessory-types', overrideAccess: false })
      expect(docs.map((d) => d.slug).sort()).toEqual(['aretes', 'collares'])
    })
  })

  describe('producto → tipo de accesorio', () => {
    it('es obligatorio al crear desde el admin', async () => {
      await expect(createProduct({ name: 'Sin tipo desde admin' }, true)).rejects.toThrow(/tipo de accesorio/i)
      const ok = await createProduct({ name: 'Con tipo desde admin', accessoryType: aretes.id }, true)
      expect(ok.accessoryType).toBe(aretes.id)
    })

    it('no se puede quitar una vez asignado', async () => {
      const product = await createProduct({ name: 'Con tipo', accessoryType: collares.id }, true)
      await expect(
        payload.update({ collection: 'products', id: product.id, data: { accessoryType: null }, user: admin }),
      ).rejects.toThrow(/tipo de accesorio/i)
    })

    it('los productos anteriores sin tipo se pueden editar y cambiar de stock', async () => {
      const edited = await payload.update({ collection: 'products', id: legacy.id, data: { stock: 7 }, user: admin })
      expect(edited.stock).toBe(7)
      const assigned = await payload.update({
        collection: 'products',
        id: legacy.id,
        data: { accessoryType: aretes.id },
        user: admin,
        depth: 0,
      })
      expect(assigned.accessoryType).toBe(aretes.id)
    })
  })

  describe('consultas de la tienda', () => {
    it('getAccessoryTypes: activos, por orden y luego nombre', async () => {
      const extra = await payload.create({ collection: 'accessory-types', data: { title: 'Anillos', order: 2 } })
      expect((await getAccessoryTypes()).map((t) => t.title)).toEqual(['Aretes', 'Anillos', 'Collares'])
      await payload.delete({ collection: 'accessory-types', id: extra.id })
    })

    it('getAccessoryTypeBySlug devuelve null si no existe o está inactivo', async () => {
      expect((await getAccessoryTypeBySlug('aretes'))?.id).toBe(aretes.id)
      expect(await getAccessoryTypeBySlug(inactive.slug!)).toBeNull()
      expect(await getAccessoryTypeBySlug('no-existe')).toBeNull()
    })

    it('getAccessoryProducts: solo del tipo, activos y de colecciones activas, más recientes primero', async () => {
      await payload.delete({ collection: 'products', where: { accessoryType: { exists: true } } })
      const first = await createProduct({ name: 'Aretes uno', accessoryType: aretes.id })
      const second = await createProduct({ name: 'Aretes dos', accessoryType: aretes.id })
      await createProduct({ name: 'Collar', accessoryType: collares.id })
      await createProduct({ name: 'Aretes inactivo', accessoryType: aretes.id, active: false })
      await createProduct({ name: 'Aretes ocultos', accessoryType: aretes.id, collection: hiddenCollectionId })

      const { products, pagination } = await getAccessoryProducts(aretes.id, 12, 1)
      expect(products.map((p) => p.id)).toEqual([second.id, first.id])
      expect(pagination).toMatchObject({ page: 1, totalPages: 1, totalDocs: 2 })

      const paged = await getAccessoryProducts(aretes.id, 1, 2)
      expect(paged.products.map((p) => p.id)).toEqual([first.id])
      expect(paged.pagination.totalPages).toBe(2)
    })

    it('el sitemap incluye los tipos activos', async () => {
      const urls = (await sitemap()).map((entry) => entry.url)
      expect(urls.some((u) => u.endsWith('/accesorios/aretes'))).toBe(true)
      expect(urls.some((u) => u.endsWith(`/accesorios/${inactive.slug}`))).toBe(false)
    })
  })
})
