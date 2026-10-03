import type { Access } from 'payload'

// Los únicos usuarios autenticados son administradores del CMS.
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const anyone: Access = () => true

/** Admin ve todo; el público solo documentos con `active = true`. */
export const authenticatedOrActive: Access = ({ req: { user } }) => {
  if (user) return true
  return { active: { equals: true } }
}
