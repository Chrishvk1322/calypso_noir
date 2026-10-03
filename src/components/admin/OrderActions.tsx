'use client'

import { Button, ConfirmationModal, toast, useDocumentInfo, useFormModified, useModal } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

// Botones del pedido en el admin, junto a "Guardar". Cada acción que cambia el pedido pide
// confirmación con un modal antes de ejecutarse.
//  - Pendiente:  "Confirmar" (→ Finalizado, descuenta stock) y "Cancelar pedido" (lo elimina).
//  - Finalizado: "Emitir boleta de compra" (PDF) y "Anular confirmación" (→ Pendiente, repone stock).

const MODALS = {
  confirm: 'order-confirm',
  cancel: 'order-cancel',
  annul: 'order-annul',
} as const

type ErrorBody = { errors?: { message?: string }[]; message?: string }

const errorMessage = async (response: Response, fallback: string) => {
  try {
    const body = (await response.json()) as ErrorBody
    return body.errors?.[0]?.message ?? body.message ?? fallback
  } catch {
    return fallback
  }
}

export function OrderActions() {
  const { id, savedDocumentData } = useDocumentInfo()
  const { openModal } = useModal()
  const modified = useFormModified()
  const router = useRouter()

  if (!id) return null // Pedido nuevo: todavía no hay acciones.

  const status = savedDocumentData?.status as string | undefined
  const code = (savedDocumentData?.orderCode as string | undefined) ?? 'este pedido'

  const setStatus = async (next: 'pending' | 'completed', success: string) => {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (!response.ok) {
      toast.error(await errorMessage(response, 'No se pudo actualizar el pedido.'))
      return
    }
    toast.success(success)
    // Recarga la vista para mostrar el nuevo estado, el stock y la fecha de venta.
    window.location.reload()
  }

  const cancelOrder = async () => {
    const response = await fetch(`/api/orders/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!response.ok) {
      toast.error(await errorMessage(response, 'No se pudo cancelar el pedido.'))
      return
    }
    toast.success(`Pedido ${code} cancelado y eliminado.`)
    router.push('/admin/collections/orders')
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
        {modified && (
          <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>Guarda los cambios antes de usar estas acciones.</span>
        )}

        {status === 'pending' && (
          <>
            <Button
              buttonStyle="primary"
              size="medium"
              margin={false}
              disabled={modified}
              onClick={() => openModal(MODALS.confirm)}
            >
              Confirmar
            </Button>
            <Button
              buttonStyle="error"
              size="medium"
              margin={false}
              disabled={modified}
              onClick={() => openModal(MODALS.cancel)}
            >
              Cancelar pedido
            </Button>
          </>
        )}

        {status === 'completed' && (
          <>
            <Button buttonStyle="primary" size="medium" margin={false} el="anchor" url={`/api/orders/${id}/boleta`}>
              Emitir boleta de compra
            </Button>
            <Button
              buttonStyle="secondary"
              size="medium"
              margin={false}
              disabled={modified}
              onClick={() => openModal(MODALS.annul)}
            >
              Anular confirmación
            </Button>
          </>
        )}
      </div>

      <ConfirmationModal
        modalSlug={MODALS.confirm}
        heading="Confirmar pedido"
        body={`¿Confirmar el pedido ${code}? Pasará a "Finalizado" y se descontará el stock de sus productos.`}
        confirmLabel="Sí, confirmar"
        confirmingLabel="Confirmando…"
        cancelLabel="Volver"
        onConfirm={() => setStatus('completed', `Pedido ${code} finalizado.`)}
      />
      <ConfirmationModal
        modalSlug={MODALS.cancel}
        heading="Cancelar pedido"
        body={`¿Cancelar el pedido ${code}? Se eliminará definitivamente y no se podrá recuperar.`}
        confirmLabel="Sí, cancelar y eliminar"
        confirmingLabel="Eliminando…"
        cancelLabel="Volver"
        onConfirm={cancelOrder}
      />
      <ConfirmationModal
        modalSlug={MODALS.annul}
        heading="Anular confirmación"
        body={`¿Anular la confirmación del pedido ${code}? Volverá a "Pendiente" y se repondrá el stock de sus productos.`}
        confirmLabel="Sí, anular"
        confirmingLabel="Anulando…"
        cancelLabel="Volver"
        onConfirm={() => setStatus('pending', `Se anuló la confirmación del pedido ${code}.`)}
      />
    </>
  )
}
