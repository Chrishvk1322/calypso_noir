import type { CollectionSlug, FieldHook, PayloadRequest } from 'payload'

/** "Colección Ñandú 2025!" → "coleccion-nandu-2025" */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slugExists = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  slug: string,
  currentId?: number | string,
): Promise<boolean> => {
  const { totalDocs } = await req.payload.count({
    collection,
    req,
    where: {
      and: [
        { slug: { equals: slug } },
        ...(currentId !== undefined ? [{ id: { not_equals: currentId } }] : []),
      ],
    },
  })
  return totalDocs > 0
}

/**
 * Genera el slug a partir de `sourceField` cuando está vacío, y lo vuelve único
 * agregando un sufijo numérico (`-2`, `-3`, ...) si ya existe.
 */
export const formatSlug =
  (sourceField: string): FieldHook =>
  async ({ value, data, originalDoc, req, collection }) => {
    const raw = typeof value === 'string' && value.trim() ? value : data?.[sourceField]
    if (typeof raw !== 'string' || !raw.trim() || !collection) return value

    const base = slugify(raw)
    if (!base) return value

    const currentId = originalDoc?.id
    let candidate = base
    let suffix = 2
    while (await slugExists(req, collection.slug as CollectionSlug, candidate, currentId)) {
      candidate = `${base}-${suffix++}`
    }
    return candidate
  }
