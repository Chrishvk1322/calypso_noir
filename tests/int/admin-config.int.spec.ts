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
})
