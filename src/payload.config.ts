import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { es } from 'payload/i18n/es'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AccessoryTypes } from './collections/AccessoryTypes'
import { Collections } from './collections/Collections'
import { HeroSlides } from './collections/HeroSlides'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { migrations } from './migrations'
import { SiteConfig } from './globals/SiteConfig'
import { withAdminDefaults, withoutDocumentTabs } from './lib/admin-config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Calypso Noir',
      icons: [{ rel: 'icon', type: 'image/jpeg', url: '/assets/logo.jpg' }],
    },
    // Fechas del admin como "03/10/2026 - 11:56 AM" (patrón de date-fns).
    dateFormat: 'dd/MM/yyyy - hh:mm a',
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  // Sin pestañas "Editar"/"API" y con "Cancelar" al crear (ver lib/admin-config.ts).
  collections: [Orders, Products, Collections, AccessoryTypes, HeroSlides, Media, Users].map(
    withAdminDefaults,
  ),
  globals: [SiteConfig].map(withoutDocumentTabs),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // En producción las migraciones pendientes se aplican al arrancar (la imagen standalone no
    // trae el CLI de Payload). En desarrollo se sigue usando push. Ver CLAUDE.md → Despliegue.
    // Durante `next build` no hay base de datos: ahí no se migra (se hará al arrancar el servidor).
    prodMigrations: process.env.NEXT_PHASE === 'phase-production-build' ? undefined : migrations,
  }),
  // Correo (recuperar contraseña del admin) por SMTP de Gmail con una contraseña de aplicación.
  // Solo si hay SMTP configurado (producción): en desarrollo y pruebas Payload lo escribe en consola.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || process.env.SMTP_USER || '',
        defaultFromName: 'Calypso Noir',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  plugins: [],
})
