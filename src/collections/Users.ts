import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Administrador', plural: 'Administradores' },
  admin: {
    useAsTitle: 'email',
    group: 'Sistema',
  },
  auth: true,
  fields: [
    // El email lo agrega `auth` automáticamente.
  ],
}
