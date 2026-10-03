import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { getPayloadClient } from '@/lib/payload'

let payload: Payload

describe('Conexión a Payload + PostgreSQL', () => {
  beforeAll(async () => {
    payload = await getPayloadClient()
  })

  it('usa la base de datos de pruebas', () => {
    expect(process.env.DATABASE_URL).toMatch(/\/calypso_test$/)
  })

  it('inicializa la Local API', () => {
    expect(payload.collections.users).toBeDefined()
    expect(payload.collections.media).toBeDefined()
  })

  it('consulta la colección users', async () => {
    const users = await payload.find({ collection: 'users', limit: 1 })
    expect(users.docs).toBeInstanceOf(Array)
  })
})
