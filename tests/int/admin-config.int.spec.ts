import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'

let payload: Payload

type TabsAdmin = {
  hideAPIURL?: boolean
  components?: { views?: { edit?: { default?: { tab?: { condition?: (args: never) => boolean } } } } }
}

const expectNoTabs = (admin: TabsAdmin | undefined) => {
  expect(admin?.hideAPIURL).toBe(true)
  const condition = admin?.components?.views?.edit?.default?.tab?.condition
  expect(condition).toBeTypeOf('function')
  expect(condition?.({} as never)).toBe(false)
}

const CANCEL_CREATE = '/components/admin/CancelCreate#CancelCreate'
const DELETE_DOCUMENT = '/components/admin/DeleteDocument#DeleteDocument'

describe('Ajustes del admin: sin pestañas "Editar"/"API" y con "Cancelar" al crear', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
  })

  it('oculta las pestañas y añade "Cancelar" en todas las colecciones', () => {
    for (const collection of payload.config.collections) {
      // Colecciones internas de Payload (preferencias, migraciones, locks) no tienen vista de edición.
      if (collection.slug.startsWith('payload-')) continue
      expectNoTabs(collection.admin as TabsAdmin)
      expect(collection.admin.components?.edit?.beforeDocumentControls, collection.slug).toContain(CANCEL_CREATE)
    }
  })

  it('las oculta en el global SiteConfig', () => {
    for (const global of payload.config.globals) expectNoTabs(global.admin as TabsAdmin)
  })

  it('conserva los botones propios de Pedidos junto a "Cancelar"', () => {
    const orders = payload.config.collections.find(({ slug }) => slug === 'orders')
    expect(orders?.admin.components?.edit?.beforeDocumentControls).toEqual([
      '/components/admin/OrderActions#OrderActions',
      CANCEL_CREATE,
    ])
  })

  describe('sin "Editar"/"Eliminar" en las listas', () => {
    const editable = () => payload.config.collections.filter(({ slug }) => !slug.startsWith('payload-'))

    it('desactiva las acciones masivas en todas las colecciones', () => {
      for (const collection of editable()) {
        expect(collection.disableBulkEdit, collection.slug).toBe(true)
        expect(collection.disableBulkDelete, collection.slug).toBe(true)
      }
    })

    it('añade "Eliminar" con confirmación dentro del registro (Pedidos usa "Cancelar pedido")', () => {
      for (const collection of editable()) {
        const controls = collection.admin.components?.edit?.beforeDocumentControls ?? []
        expect(controls.includes(DELETE_DOCUMENT), collection.slug).toBe(collection.slug !== 'orders')
      }
    })

    it('la API con control de acceso rechaza editar o borrar en masa; la Local API no cambia', async () => {
      const where = { title: { equals: 'No existe QA' } }
      await expect(payload.delete({ collection: 'collections', where, overrideAccess: false })).rejects.toThrow(
        /bulk delete/,
      )
      await expect(
        payload.update({ collection: 'collections', where, data: { active: true }, overrideAccess: false }),
      ).rejects.toThrow(/bulk edit/)
      await expect(payload.delete({ collection: 'collections', where })).resolves.toMatchObject({ docs: [] })
    })
  })
})
