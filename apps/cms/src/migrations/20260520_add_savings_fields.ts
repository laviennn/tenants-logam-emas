import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      ADD COLUMN IF NOT EXISTS "savings_member_id_prefix" varchar,
      ADD COLUMN IF NOT EXISTS "savings_gold_symbol" varchar
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      DROP COLUMN IF EXISTS "savings_member_id_prefix",
      DROP COLUMN IF EXISTS "savings_gold_symbol"
  `)
}
