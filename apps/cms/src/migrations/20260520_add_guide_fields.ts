import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      ADD COLUMN IF NOT EXISTS "guide_title" varchar DEFAULT 'Panduan Tabungan Emas',
      ADD COLUMN IF NOT EXISTS "guide_content" jsonb
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      DROP COLUMN IF EXISTS "guide_title",
      DROP COLUMN IF EXISTS "guide_content"
  `)
}
