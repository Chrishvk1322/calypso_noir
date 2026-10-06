import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import fs from 'fs/promises'
import { getPayload } from 'payload'

import { mediaFilePath, normalizeOriginalFile } from '@/hooks/media'

// Ajusta las imágenes subidas antes de la optimización de almacenamiento. Idempotente:
// 1. Borra los archivos y columnas del tamaño "hero" (ya no se genera; el carrusel y la portada de
//    colección usan el original). En desarrollo el push de Payload pediría confirmar el borrado de
//    columnas: ahí se borran antes con SQL y este paso no encuentra nada.
// 2. Convierte a WebP los originales que quedaron en otro formato (recortes hechos en el admin).
//    No recomprime los que ya son WebP, para no perder calidad.
// Usa SQL para no cambiar `updated_at` salvo en las imágenes convertidas (su `?v=` debe cambiar).
const payload = await getPayload({ config })
const db = payload.db as unknown as PostgresAdapter

const heroColumn = await db.drizzle.execute(sql`
  select 1 from information_schema.columns
  where table_name = 'media' and column_name = 'sizes_hero_filename'
`)
let heroFiles = 0
if (heroColumn.rows.length) {
  const rows = await db.drizzle.execute<{ filename: string }>(
    sql`select sizes_hero_filename as filename from media where sizes_hero_filename is not null`,
  )
  for (const { filename } of rows.rows) {
    await fs.rm(mediaFilePath(payload, filename), { force: true })
    heroFiles++
  }
  await db.drizzle.execute(sql`
    alter table media
      drop column if exists sizes_hero_url,
      drop column if exists sizes_hero_width,
      drop column if exists sizes_hero_height,
      drop column if exists sizes_hero_mime_type,
      drop column if exists sizes_hero_filesize,
      drop column if exists sizes_hero_filename
  `)
}

const media = await db.drizzle.execute<{ id: number; filename: string }>(
  sql`select id, filename from media where filename is not null`,
)
let converted = 0
for (const { id, filename } of media.rows) {
  const file = mediaFilePath(payload, filename)
  const exists = await fs.access(file).then(() => true, () => false)
  if (!exists) continue

  const fixed = await normalizeOriginalFile(file, { onlyWrongFormat: true })
  if (!fixed) continue
  await db.drizzle.execute(sql`
    update media
    set filesize = ${fixed.filesize}, width = ${fixed.width}, height = ${fixed.height},
        mime_type = ${fixed.mimeType}, updated_at = now()
    where id = ${id}
  `)
  payload.logger.info(`Convertida a WebP: ${filename}`)
  converted++
}

payload.logger.info(`Tamaño "hero": ${heroFiles} archivo(s) borrado(s). Originales convertidos a WebP: ${converted}.`)
process.exit(0)
