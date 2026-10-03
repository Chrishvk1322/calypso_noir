import type { TextField } from 'payload'

import { formatSlug } from '@/hooks/slugify'

/**
 * Campo `slug` autogenerado desde `sourceField`, único e indexado.
 *
 * No se marca `required` porque el formulario del admin valida antes de que corra el hook
 * (bloquearía guardar con el slug vacío). Como `sourceField` es obligatorio, el hook
 * siempre lo completa; la validación solo exige valor cuando hay datos de origen.
 */
export const slugField = (sourceField: string): TextField => ({
  name: 'slug',
  type: 'text',
  label: 'Slug',
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Se genera automáticamente si se deja vacío.',
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField)],
  },
  validate: (value, { data }) => {
    const source = (data as Record<string, unknown>)?.[sourceField]
    if (value && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return 'Solo minúsculas, números y guiones.'
    }
    return Boolean(value) || !source || 'No se pudo generar el slug.'
  },
})
