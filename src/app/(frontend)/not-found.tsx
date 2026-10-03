import { NotFoundContent } from '@/components/shop/NotFoundContent'

// Se muestra cuando una página de la tienda llama a notFound() (producto o colección inexistente).
// `metadata` no se aplica en not-found: el título se declara con <title> (React lo sube al <head>).
export default function NotFound() {
  return (
    <>
      <title>Página no encontrada · Calypso Noir</title>
      <NotFoundContent />
    </>
  )
}
