import Image from 'next/image'

// Placeholder de la Fase 1: la Home real (carrusel + feed de colecciones) se construye en la Fase 4.
export default function HomePage() {
  return (
    <div className="placeholder">
      <Image src="/assets/logo.jpg" alt="Logo de Calypso Noir" width={160} height={160} priority />
      <h1>Calypso Noir</h1>
      <p>Tienda en construcción.</p>
    </div>
  )
}
