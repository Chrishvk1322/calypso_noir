import type { Metadata } from 'next'

import { ComingSoon } from '@/components/shop/ComingSoon'

export const metadata: Metadata = { title: 'Catálogo' }

export default function Page() {
  return <ComingSoon title="Catálogo" phase={4} />
}
