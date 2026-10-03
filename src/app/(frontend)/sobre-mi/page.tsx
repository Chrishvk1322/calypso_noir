import type { Metadata } from 'next'

import { ComingSoon } from '@/components/shop/ComingSoon'

export const metadata: Metadata = { title: 'Sobre mí' }

export default function Page() {
  return <ComingSoon title="Sobre mí" phase={7} />
}
