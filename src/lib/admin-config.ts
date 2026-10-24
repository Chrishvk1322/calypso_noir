import type { CollectionConfig, GlobalConfig } from 'payload'

const CANCEL_CREATE = '/components/admin/CancelCreate#CancelCreate'
const DELETE_DOCUMENT = '/components/admin/DeleteDocument#DeleteDocument'

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

/** Añade componentes junto a "Guardar" en la vista de un registro. */
const withDocumentControls = (config: CollectionConfig, controls: string[]): CollectionConfig => {
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
          beforeDocumentControls: [...(edit?.beforeDocumentControls ?? []), ...controls],
        },
      },
    },
  }
}

/** Añade el botón "Cancelar" junto a "Guardar" al crear un registro (ver `CancelCreate`). */
export const withCancelOnCreate = (config: CollectionConfig) => withDocumentControls(config, [CANCEL_CREATE])

/**
 * Quita "Editar" y "Eliminar" de la lista (aparecían al marcar casillas): se edita entrando al
 * registro y se elimina desde ahí con el botón "Eliminar", que pide confirmación (ver
 * `DeleteDocument`). También bloquea esas operaciones masivas en la API REST; la Local API
 * (hooks, scripts, pruebas) no cambia. Pedidos ya tiene su propio "Cancelar pedido".
 */
export function withoutBulkActions(config: CollectionConfig): CollectionConfig {
  const single = { ...config, disableBulkEdit: true, disableBulkDelete: true }
  return config.slug === 'orders' ? single : withDocumentControls(single, [DELETE_DOCUMENT])
}

/** Ajustes del admin comunes a todas las colecciones. */
export const withAdminDefaults = (config: CollectionConfig) =>
  withoutBulkActions(withCancelOnCreate(withoutDocumentTabs(config)))
