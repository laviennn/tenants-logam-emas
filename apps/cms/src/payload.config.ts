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
import { SavingsBalances } from './collections/SavingsBalances'
import { SavingsLedgers } from './collections/SavingsLedgers'
import { Customers } from './collections/Customers'

// Formerly globals — now collections for multi-tenant support
import { SiteSettings } from './collections/SiteSettings'
import { GoldPrice } from './collections/GoldPrice'
import { Copywriting } from './collections/Copywriting'

import { s3Storage } from '@payloadcms/storage-s3'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  cors: '*',
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
          
          // Get tenant ID from logged in user
          const user = (req as any).user
          const tenantId = user && typeof user.tenant === 'object' ? user.tenant?.id : user?.tenant
          
          await triggerVercelRebuild(tenantId)
          return Response.json({ success: true })
        } catch (error) {
          return Response.json(
            { success: false, error: 'Failed to trigger rebuild' },
            { status: 500 },
          )
        }
      },
    },
    {
      path: '/register-customer',
      method: 'post',
      handler: async (req) => {
        try {
          const body = await (req as any).json();
          console.log('\n======================================');
          console.log(`[AUTH] Percobaan Registrasi Konsumen`);
          console.log(`Waktu: ${new Date().toLocaleString()}`);
          console.log(`Email: ${body.email}`);
          console.log(`Tenant ID: ${body.tenantId}`);
          if (body.kycType) {
            console.log(`KYC Type: ${body.kycType}`);
            console.log(`KYC Number: ${body.kycNumber}`);
            console.log(`Bank Name: ${body.bankName}`);
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createClient(
            process.env.PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          );

          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
            user_metadata: {
              roles: ['customer'],
              full_name: body.fullName,
              kycType: body.kycType,
              kycNumber: body.kycNumber,
              bankName: body.bankName,
              bankAccountNumber: body.bankAccountNumber,
            }
          });

          if (error) {
            console.log(`Status: Failed (Supabase)`);
            console.log(`Error: ${error.message}`);
            console.log('======================================\n');
            return Response.json({ success: false, error: error.message }, { status: 400 });
          }

          // Create a Customer record in Payload CMS linked to the tenant
          if (body.tenantId) {
            try {
              const customerData: any = {
                email: body.email,
                fullName: body.fullName || null,
                tenant: body.tenantId,
                supabaseUserId: data.user?.id || null,
                isBlocked: false,
              };

              // Only add KYC if provided
              if (body.kycType || body.kycNumber || body.bankName || body.bankAccountNumber) {
                customerData.kyc = {
                  kycType: body.kycType || null,
                  kycNumber: body.kycNumber || null,
                  bankName: body.bankName || null,
                  bankAccountNumber: body.bankAccountNumber || null,
                };
              }

              await (req as any).payload.create({
                collection: 'customers',
                data: customerData,
                overrideAccess: true,
              });

              console.log(`Customer record created in Payload CMS for tenant ${body.tenantId}`);
            } catch (cmsErr: any) {
              // Non-fatal: log but don't block registration
              console.warn(`[WARN] Failed to create Customer record in CMS: ${cmsErr.message}`);
            }
          }

          console.log(`Status: Success`);
          console.log('======================================\n');
          return Response.json({ success: true, user: data.user });
        } catch (error: any) {
          console.log(`Status: Server Error`);
          console.log(`Error: ${error.message}`);
          console.log('======================================\n');
          return Response.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
        }
      },
    },
    {
      path: '/check-customer',
      method: 'get',
      handler: async (req) => {
        try {
          const url = new URL((req as any).url);
          const email = url.searchParams.get('email');
          const tenantId = url.searchParams.get('tenantId');

          if (!email || !tenantId) {
            return Response.json({ success: false, error: 'Missing email or tenantId' }, { status: 400 });
          }

          const result = await (req as any).payload.find({
            collection: 'customers',
            where: { email: { equals: email } },
            limit: 1,
            overrideAccess: true,
          });

          const customer = result.docs?.[0];

          if (!customer) {
            // No customer record — allow login (legacy or cross-tenant users are ignored)
            return Response.json({ success: true, blocked: false, wrongTenant: false, found: false });
          }

          const customerTenantId =
            typeof customer.tenant === 'object' ? customer.tenant?.id : customer.tenant;

          const wrongTenant = String(customerTenantId) !== String(tenantId);
          const blocked = customer.isBlocked === true;

          return Response.json({
            success: true,
            blocked,
            wrongTenant,
            found: true,
          });
        } catch (error: any) {
          console.error('[check-customer] Error:', error.message);
          // Fail open to not block legitimate users if CMS is down
          return Response.json({ success: true, blocked: false, wrongTenant: false, found: false });
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
    // ── Gold Vault (AKUAN) ────────────────────────────────────
    SavingsBalances,
    SavingsLedgers,
    // ── Customers ────────────────────────────────────────────
    Customers,
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
// Schema reload trigger - updated 2026-05-20-v2

