'use client'

import { Button, useConfig, useDocumentInfo, useEditDepth, useForm } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

// Botón "Cancelar" junto a "Guardar" al crear un registro: descarta lo escrito y vuelve a la
// pantalla anterior del admin siguiendo el historial (como el botón "atrás"). Si se entró directo
// por URL o la página anterior no es del admin, vuelve al listado de la colección.

// Navigation API (Chromium, Firefox, Safari recientes); aún no está en los tipos de TypeScript.
type NavigationLike = { currentEntry: { index: number } | null; entries: () => { url: string | null }[] }

const previousAdminEntry = (adminPath: string) => {
  const navigation = (window as Window & { navigation?: NavigationLike }).navigation
  const index = navigation?.currentEntry?.index
  if (!navigation || index === undefined || index < 1) return false

  const url = navigation.entries()[index - 1]?.url
  if (!url) return false
  const previous = new URL(url)
  return previous.origin === window.location.origin && previous.pathname.startsWith(adminPath)
}

export function CancelCreate() {
  const { id, collectionSlug } = useDocumentInfo()
  const editDepth = useEditDepth()
  const { setModified } = useForm()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()
  const router = useRouter()

  // Solo en "Crear nuevo" de la vista principal: los drawers (profundidad > 1) ya tienen su
  // propio botón de cerrar.
  if (id || !collectionSlug || editDepth > 1) return null

  const cancel = () => {
    // Descartar lo escrito: sin esto el aviso "¿salir sin guardar?" del navegador queda activo.
    setModified(false)
    if (previousAdminEntry(adminRoute)) router.back()
    else router.push(`${adminRoute}/collections/${collectionSlug}`)
  }

  return (
    <Button buttonStyle="secondary" size="medium" margin={false} onClick={cancel}>
      Cancelar
    </Button>
  )
}
