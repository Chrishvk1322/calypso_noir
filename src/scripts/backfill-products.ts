import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import { toSortName } from '@/lib/filters'

// Rellena los campos ocultos de ordenamiento en productos creados antes de que existieran:
// `effective_price` (precio que se cobra) y `sort_name` (nombre sin tildes, en minúsculas).
// Idempotente: solo toca filas vacías y usa SQL para no cambiar su `updated_at`. Los productos
// guardados desde el admin ya los calculan con el hook `setSortFields`.
const payload = await getPayload({ config })
const db = payload.db as unknown as PostgresAdapter

const prices = await db.drizzle.execute(sql`
  update products
  set effective_price = case
    when on_sale and sale_price > 0 and sale_price < price then sale_price
    else price
  end
  where effective_price is null
`)

const pending = await db.drizzle.execute<{ id: number; name: string }>(
  sql`select id, name from products where sort_name is null`,
)
for (const { id, name } of pending.rows) {
  await db.drizzle.execute(sql`update products set sort_name = ${toSortName(name)} where id = ${id}`)
}

payload.logger.info(
  `effectivePrice rellenado en ${prices.rowCount ?? 0} producto(s); sortName en ${pending.rows.length}.`,
)
process.exit(0)
