import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag, unstable_cache: (fn: unknown) => fn }))

const { revalidateTags } = await import('@/hooks/revalidate')

const fakeReq = (context: Record<string, unknown> = {}) =>
  ({ context, payload: { logger: { warn: vi.fn() } } }) as never

describe('revalidateTags', () => {
  beforeEach(() => {
    revalidateTag.mockReset()
  })
  afterEach(() => {
    delete process.env.NEXT_RUNTIME
  })

  it('dentro de Next invalida cada etiqueta sin servir contenido viejo', () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    revalidateTags(['products', 'media'], fakeReq())
    expect(revalidateTag.mock.calls).toEqual([
      ['products', { expire: 0 }],
      ['media', { expire: 0 }],
    ])
  })

  it('fuera de Next (seed, pruebas) no hace nada', () => {
    revalidateTags(['products'], fakeReq())
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('respeta context.disableRevalidate', () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    revalidateTags(['products'], fakeReq({ disableRevalidate: true }))
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('si revalidateTag falla, registra un aviso y no rompe la escritura', () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    revalidateTag.mockImplementation(() => {
      throw new Error('fuera de contexto')
    })
    const warn = vi.fn()
    // Si relanzara el error, la prueba fallaría aquí.
    revalidateTags(['products', 'media'], { context: {}, payload: { logger: { warn } } } as never)
    expect(revalidateTag).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledTimes(2)
  })
})
