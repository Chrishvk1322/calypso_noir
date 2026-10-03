import { getPayload } from 'payload'

import config from '@/payload.config'

/** Instancia de Payload (Local API) para usar en Server Components y route handlers. */
export const getPayloadClient = () => getPayload({ config })
