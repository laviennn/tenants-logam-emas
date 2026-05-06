import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Multi-Tenant Migration — Fully idempotent, no parameterized DO blocks.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {

  // ── 1. TABLES ─────────────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenants" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "primary_domain" varchar,
      "primary_color" varchar DEFAULT '#D4AF37',
      "primary_dark_color" varchar DEFAULT '#b5952f',
      "secondary_color" varchar DEFAULT '#FFDF00',
      "background_dark_color" varchar DEFAULT '#121212',
      "surface_dark_color" varchar DEFAULT '#1e1e1e',
      "navbar_bg_color" varchar DEFAULT '#D4AF37',
      "button_color" varchar DEFAULT '#D4AF37',
      "font_family" varchar DEFAULT 'Inter',
      "vercel_deploy_hook_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenants_domains" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "domain" varchar NOT NULL
    )
  `)

  // ── 2. INDEXES ────────────────────────────────────────────────────────────────
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" USING btree ("slug")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenants_created_at_idx" ON "tenants" USING btree ("created_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenants_domains_order_idx" ON "tenants_domains" USING btree ("_order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenants_domains_parent_id_idx" ON "tenants_domains" USING btree ("_parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "tenants_domains_domain_idx" ON "tenants_domains" USING btree ("domain")`)

  // ── 3. PARENT FK (with conflict guard) ───────────────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "tenants_domains"
        ADD CONSTRAINT "tenants_domains_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `)

  // ── 4. SEED TENANT #1 ─────────────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO "tenants" (
      "name", "slug", "is_active", "primary_domain",
      "primary_color", "primary_dark_color", "secondary_color",
      "background_dark_color", "surface_dark_color", "navbar_bg_color",
      "button_color", "font_family", "updated_at", "created_at"
    ) VALUES (
      'Logam Mulia Antam', 'logam-mulia-antam', true, 'www.logammulia-antam.com',
      '#D4AF37', '#b5952f', '#FFDF00', '#121212', '#1e1e1e',
      '#D4AF37', '#D4AF37', 'Inter', now(), now()
    ) ON CONFLICT (slug) DO NOTHING
  `)

  await db.execute(sql`
    INSERT INTO "tenants_domains" ("_order", "_parent_id", "id", "domain")
    SELECT 1, t.id, 'domain-' || t.id || '-1', 'www.logammulia-antam.com'
    FROM "tenants" t WHERE t.slug = 'logam-mulia-antam'
    ON CONFLICT DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO "tenants_domains" ("_order", "_parent_id", "id", "domain")
    SELECT 2, t.id, 'domain-' || t.id || '-2', 'logammulia-antam.com'
    FROM "tenants" t WHERE t.slug = 'logam-mulia-antam'
    ON CONFLICT DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO "tenants_domains" ("_order", "_parent_id", "id", "domain")
    SELECT 3, t.id, 'domain-' || t.id || '-3', 'localhost:4321'
    FROM "tenants" t WHERE t.slug = 'logam-mulia-antam'
    ON CONFLICT DO NOTHING
  `)
  await db.execute(sql`
    INSERT INTO "tenants_domains" ("_order", "_parent_id", "id", "domain")
    SELECT 4, t.id, 'domain-' || t.id || '-4', 'localhost'
    FROM "tenants" t WHERE t.slug = 'logam-mulia-antam'
    ON CONFLICT DO NOTHING
  `)

  // ── 5. ADD tenant_id COLUMNS ─────────────────────────────────────────────────
  await db.execute(sql`ALTER TABLE "categories"   ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "products"      ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "articles"      ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "testimonials"  ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "reviews"       ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "transactions"  ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "media"         ADD COLUMN IF NOT EXISTS "tenant_id" integer`)
  await db.execute(sql`ALTER TABLE "users"         ADD COLUMN IF NOT EXISTS "tenant_id" integer`)

  // ── 6. ASSIGN DATA ────────────────────────────────────────────────────────────
  await db.execute(sql`UPDATE "categories"  SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)
  await db.execute(sql`UPDATE "products"    SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)
  await db.execute(sql`UPDATE "articles"    SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)
  await db.execute(sql`UPDATE "testimonials" SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)
  await db.execute(sql`UPDATE "reviews"     SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)
  await db.execute(sql`UPDATE "transactions" SET "tenant_id" = (SELECT id FROM "tenants" WHERE slug = 'logam-mulia-antam' LIMIT 1) WHERE "tenant_id" IS NULL`)

  // Assign Owner role to all existing users via users_roles table
  await db.execute(sql`
    INSERT INTO "users_roles" ("order", "parent_id", "value")
    SELECT 1, id, 'owner' FROM "users"
    ON CONFLICT DO NOTHING
  `)

  // ── 7. NOT NULL constraints ───────────────────────────────────────────────────
  // Use EXCEPTION approach — no parameterized DO blocks
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "categories"   ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "products"     ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "articles"     ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "testimonials" ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "reviews"      ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN ALTER TABLE "transactions" ALTER COLUMN "tenant_id" SET NOT NULL;
    EXCEPTION WHEN others THEN NULL; END $$
  `)

  // ── 8. FOREIGN KEYS (EXCEPTION on duplicate) ─────────────────────────────────
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "articles" ADD CONSTRAINT "articles_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)

  // ── 9. PERFORMANCE INDEXES ────────────────────────────────────────────────────
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "categories_tenant_idx"   ON "categories"   USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "products_tenant_idx"     ON "products"     USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "articles_tenant_idx"     ON "articles"     USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "testimonials_tenant_idx" ON "testimonials" USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "reviews_tenant_idx"      ON "reviews"      USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "transactions_tenant_idx" ON "transactions" USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "media_tenant_idx"        ON "media"        USING btree ("tenant_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "users_tenant_idx"        ON "users"        USING btree ("tenant_id")`)

  // ── 10. payload_locked_documents_rels ────────────────────────────────────────
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "tenants_id"      integer`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "site_settings_id" integer`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "gold_price_id"   integer`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "copywriting_id"  integer`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "reviews_id"      integer`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk"
        FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tenants_id_idx"       ON "payload_locked_documents_rels" USING btree ("tenants_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_site_settings_id_idx" ON "payload_locked_documents_rels" USING btree ("site_settings_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gold_price_id_idx"    ON "payload_locked_documents_rels" USING btree ("gold_price_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_copywriting_id_idx"   ON "payload_locked_documents_rels" USING btree ("copywriting_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx"       ON "payload_locked_documents_rels" USING btree ("reviews_id")`)

  console.log('[Migration] ✅ Multi-tenant schema applied. All data assigned to Tenant #1: Logam Mulia Antam')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tenants_fk"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tenants_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "site_settings_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "gold_price_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "copywriting_id"`)
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reviews_id"`)

  await db.execute(sql`ALTER TABLE "categories"   DROP CONSTRAINT IF EXISTS "categories_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "products"     DROP CONSTRAINT IF EXISTS "products_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "articles"     DROP CONSTRAINT IF EXISTS "articles_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "testimonials" DROP CONSTRAINT IF EXISTS "testimonials_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "reviews"      DROP CONSTRAINT IF EXISTS "reviews_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "media"        DROP CONSTRAINT IF EXISTS "media_tenant_id_tenants_id_fk"`)
  await db.execute(sql`ALTER TABLE "users"        DROP CONSTRAINT IF EXISTS "users_tenant_id_tenants_id_fk"`)

  await db.execute(sql`ALTER TABLE "categories"   DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "products"     DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "articles"     DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "reviews"      DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "media"        DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "users"        DROP COLUMN IF EXISTS "tenant_id"`)
  await db.execute(sql`ALTER TABLE "users"        DROP COLUMN IF EXISTS "roles"`)

  await db.execute(sql`DROP TABLE IF EXISTS "tenants_domains" CASCADE`)
  await db.execute(sql`DROP TABLE IF EXISTS "tenants" CASCADE`)
}
