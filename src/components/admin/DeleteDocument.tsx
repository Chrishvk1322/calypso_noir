'use client'

import {
  Button,
  ConfirmationModal,
  toast,
  useAuth,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useEditDepth,
  useForm,
  useModal,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

// Botón "Eliminar" dentro de un registro, junto a "Guardar". Reemplaza al borrado desde la lista
// (casillas + "Eliminar"), que se quitó para no borrar por equivocación: aquí siempre pide
// confirmación con un modal que nombra el registro.

const MODAL = 'delete-document'

type ErrorBody = { errors?: { message?: string }[]; message?: string }

const errorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as ErrorBody
    return body.errors?.[0]?.message ?? body.message
  } catch {
    return undefined
  }
}

export function DeleteDocument() {
  const { id, collectionSlug, docPermissions } = useDocumentInfo()
  const { title } = useDocumentTitle()
  const { user } = useAuth()
  const editDepth = useEditDepth()
  const { setModified } = useForm()
  const { openModal } = useModal()
  const router = useRouter()
  const {
    config: {
      routes: { admin: adminRoute, api: apiRoute },
    },
    getEntityConfig,
  } = useConfig()

  // Solo en un registro ya guardado de la vista principal (no al crear ni dentro de un drawer),
  // si el usuario puede eliminarlo. Nadie se elimina a sí mismo: se quedaría sin acceso.
  const canDelete = docPermissions && 'delete' in docPermissions && docPermissions.delete
  if (!id || !collectionSlug || editDepth > 1 || !canDelete) return null
  if (collectionSlug === 'users' && String(user?.id) === String(id)) return null

  const singular = getEntityConfig({ collectionSlug })?.labels?.singular
  const label = typeof singular === 'string' ? singular.toLowerCase() : 'registro'
  const name = title ? `"${title}"` : `este ${label}`

  const remove = async () => {
    const response = await fetch(`${apiRoute}/${collectionSlug}/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      toast.error((await errorMessage(response)) ?? 'No se pudo eliminar.')
      return
    }
    toast.success(`Se eliminó ${name}.`)
    // Sin esto, el aviso "¿salir sin guardar?" aparece si había cambios sin guardar.
    setModified(false)
    router.push(`${adminRoute}/collections/${collectionSlug}`)
  }

  return (
    <>
      <Button buttonStyle="secondary" size="medium" margin={false} onClick={() => openModal(MODAL)}>
        Eliminar
      </Button>
      <ConfirmationModal
        modalSlug={MODAL}
        heading={`Eliminar ${label}`}
        body={`¿Eliminar ${name}? Se borrará definitivamente y no se podrá recuperar.`}
        confirmLabel="Sí, eliminar"
        confirmingLabel="Eliminando…"
        cancelLabel="Volver"
        onConfirm={remove}
      />
    </>
  )
}
