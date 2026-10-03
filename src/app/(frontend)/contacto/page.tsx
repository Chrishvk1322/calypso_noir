import type { Metadata } from 'next'

import { ComingSoon } from '@/components/shop/ComingSoon'

export const metadata: Metadata = { title: 'Contacto' }

export default function Page() {
  return <ComingSoon title="Contacto" phase={7} />
}
