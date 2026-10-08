import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { generateNKeysBetween } from 'payload/shared'

type Db = MigrateUpArgs['db']

/**
 * Orden manual desde el admin: colecciones (`_order`) y productos dentro de su colección
 * (`_products_products_order`). Las filas existentes reciben claves con el orden que la tienda
 * mostraba hasta ahora (más reciente primero), así nada cambia hasta que se reordene.
 * Solo rellena las filas sin clave: se puede volver a ejecutar sin perder un orden ya elegido.
 */
export async function backfillManualOrder(db: Db): Promise<void> {
  const assign = async (table: 'collections' | 'products', column: string, ids: number[]) => {
    const keys = generateNKeysBetween(null, null, ids.length)
    for (const [i, id] of ids.entries()) {
      await db.execute(sql`UPDATE ${sql.identifier(table)} SET ${sql.identifier(column)} = ${keys[i]} WHERE id = ${id}`)
    }
  }

  const collections = await db.execute<{ id: number }>(sql`
    SELECT id FROM collections WHERE _order IS NULL ORDER BY created_at DESC, id DESC`)
  await assign('collections', '_order', collections.rows.map((row) => row.id))

  const products = await db.execute<{ id: number; collection_id: number | null }>(sql`
    SELECT id, collection_id FROM products
    WHERE _products_products_order IS NULL
    ORDER BY collection_id, created_at DESC, id DESC`)
  const byCollection = new Map<number | null, number[]>()
  for (const row of products.rows) {
    byCollection.set(row.collection_id, [...(byCollection.get(row.collection_id) ?? []), row.id])
  }
  for (const ids of byCollection.values()) await assign('products', '_products_products_order', ids)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "_products_products_order" varchar;
  ALTER TABLE "collections" ADD COLUMN "_order" varchar;
  CREATE INDEX "products__products_products_order_idx" ON "products" USING btree ("_products_products_order");
  CREATE INDEX "collections__order_idx" ON "collections" USING btree ("_order");`)
  await backfillManualOrder(db)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products__products_products_order_idx";
  DROP INDEX "collections__order_idx";
  ALTER TABLE "products" DROP COLUMN "_products_products_order";
  ALTER TABLE "collections" DROP COLUMN "_order";`)
}
