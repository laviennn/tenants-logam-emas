import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      ADD COLUMN IF NOT EXISTS "enable_two_column_grid_mobile" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "enable_announcement" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "announcement_text" varchar,
      ADD COLUMN IF NOT EXISTS "announcement_link" varchar,
      ADD COLUMN IF NOT EXISTS "enable_customer_reviews" boolean DEFAULT true
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants" 
      DROP COLUMN IF EXISTS "enable_two_column_grid_mobile",
      DROP COLUMN IF EXISTS "enable_announcement",
      DROP COLUMN IF EXISTS "announcement_text",
      DROP COLUMN IF EXISTS "announcement_link",
      DROP COLUMN IF EXISTS "enable_customer_reviews"
  `)
}
