// Las pruebas usan siempre la base de datos de pruebas (calypso_test), nunca la de desarrollo.
import { config } from 'dotenv'

config({ path: '.env.test', override: true })
