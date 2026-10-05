import type { CollectionConfig, GlobalConfig } from 'payload'

const CANCEL_CREATE = '/components/admin/CancelCreate#CancelCreate'

/**
 * Quita las pestañas "Editar" y "API" de la vista de un documento en el admin: para quien
 * administra la tienda no aportan nada y confunden. `hideAPIURL` desactiva también la vista
 * `/api` del documento; la API REST (`/api/...`) sigue funcionando porque la usa el admin.
 */
export function withoutDocumentTabs<T extends CollectionConfig | GlobalConfig>(config: T): T {
  const admin = config.admin ?? {}
  const views = admin.components?.views
  const edit = views?.edit

  return {
    ...config,
    admin: {
      ...admin,
      hideAPIURL: true,
      components: {
        ...admin.components,
        views: {
          ...views,
          edit: {
            ...edit,
            default: {
              ...edit?.default,
              tab: { ...edit?.default?.tab, condition: () => false },
            },
          },
        },
      },
    },
  }
}

/** Añade el botón "Cancelar" junto a "Guardar" al crear un registro (ver `CancelCreate`). */
export function withCancelOnCreate(config: CollectionConfig): CollectionConfig {
  const admin = config.admin ?? {}
  const edit = admin.components?.edit

  return {
    ...config,
    admin: {
      ...admin,
      components: {
        ...admin.components,
        edit: {
          ...edit,
          beforeDocumentControls: [...(edit?.beforeDocumentControls ?? []), CANCEL_CREATE],
        },
      },
    },
  }
}

/** Ajustes del admin comunes a todas las colecciones. */
export const withAdminDefaults = (config: CollectionConfig) => withCancelOnCreate(withoutDocumentTabs(config))
