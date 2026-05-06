import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { Categories } from './collections/Categories'
import { Products } from './collections/Products'
import { Transactions } from './collections/Transactions'
import { Articles } from './collections/Articles'
import { Testimonials } from './collections/Testimonials'
import { Reviews } from './collections/Reviews'

// Formerly globals — now collections for multi-tenant support
import { SiteSettings } from './collections/SiteSettings'
import { GoldPrice } from './collections/GoldPrice'
import { Copywriting } from './collections/Copywriting'

import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  cors: [
    'https://www.logammulia-antam.com',
    'https://logam-muliagold-antam.vercel.app',
    'http://localhost:4321',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  localization: {
    locales: ['id', 'en', 'my'],
    defaultLocale: 'id',
    fallback: true,
  },
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeNavLinks: ['./components/SidebarDashboardLink#SidebarDashboardLink'],
      views: {
        dashboard: {
          Component: './components/DashboardView#DashboardView',
          path: '/',
        },
      },
    },
  },
  endpoints: [
    {
      path: '/deploy',
      method: 'post',
      handler: async (req) => {
        try {
          const { triggerVercelRebuild } = await import('./utils/rebuild')
          await triggerVercelRebuild()
          return Response.json({ success: true })
        } catch (error) {
          return Response.json(
            { success: false, error: 'Failed to trigger rebuild' },
            { status: 500 },
          )
        }
      },
    },
  ],
  collections: [
    // ── Core ──────────────────────────────────────────────────
    Tenants,
    Users,
    Media,
    // ── Catalog ───────────────────────────────────────────────
    Categories,
    Products,
    Reviews,
    // ── Tenant Settings (formerly globals) ────────────────────
    SiteSettings,
    GoldPrice,
    Copywriting,
    // ── Content ───────────────────────────────────────────────
    Articles,
    Testimonials,
    // ── Sales ─────────────────────────────────────────────────
    Transactions,
  ],
  // globals removed — all migrated to tenant-scoped collections
  globals: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          generateFileURL: ({ filename }) => {
            return `${process.env.PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.S3_BUCKET || 'media'}/${filename}`
          },
        },
      },
      bucket: process.env.S3_BUCKET || 'media',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        endpoint:
          process.env.S3_ENDPOINT ||
          `https://${process.env.PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0]}.supabase.co/storage/v1/s3`,
        region: process.env.S3_REGION || 'us-east-1',
        forcePathStyle: true,
      },
    }),
  ],
})
