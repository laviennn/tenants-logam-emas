import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

export const Copywriting: CollectionConfig = {
  slug: 'copywriting',
  admin: {
    useAsTitle: 'tenant',
    group: '⚙️ Pengaturan',
    defaultColumns: ['tenant', 'updatedAt'],
    description: 'Teks copywriting halaman per tenant.',
  },
  access: {
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantDelete,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      label: 'Tenant',
      hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
        condition: (_data: any, _siblingData: any, { user }: any) => isOwner(user),
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layanan & Hero',
          fields: [
            {
              name: 'heroTitle',
              type: 'text',
              label: 'Judul Hero Layanan',
              localized: true,
              required: true,
              defaultValue: 'Layanan Kami',
            },
            {
              name: 'servicesDescription',
              type: 'textarea',
              label: 'Deskripsi Layanan',
              localized: true,
              required: true,
              defaultValue:
                'Kami menyediakan pelbagai perkhidmatan terbaik untuk memenuhi keperluan pelaburan emas anda dengan profesional dan dipercayai.',
            },
          ],
        },
        {
          label: 'Kelebihan Emas',
          fields: [
            {
              name: 'advantagesTitle',
              type: 'text',
              label: 'Judul Seksi Kelebihan',
              localized: true,
              required: true,
              defaultValue: '6 Kelebihan Menyimpan Emas',
            },
            {
              name: 'advantages',
              type: 'array',
              label: 'Daftar Kelebihan',
              minRows: 1,
              fields: [
                { name: 'icon', type: 'text', label: 'Ikon (Emoji)', required: true },
                { name: 'title', type: 'text', label: 'Judul', localized: true, required: true },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Deskripsi',
                  localized: true,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Why Choose Us',
          fields: [
            {
              name: 'whyTitle',
              type: 'text',
              label: 'Judul Why Choose Us',
              localized: true,
              required: true,
              defaultValue: 'Mengapa Memilih Kami?',
            },
            {
              name: 'whySubtitle',
              type: 'textarea',
              label: 'Sub-judul Why Choose Us',
              localized: true,
              required: true,
              defaultValue:
                'Kami memiliki keunggulan yang memberikan nilai tambah untuk investasi Anda',
            },
            {
              name: 'whyFeatures',
              type: 'array',
              label: 'Daftar Fitur Why Choose Us',
              minRows: 1,
              fields: [
                { name: 'icon', type: 'text', label: 'Ikon (Emoji)', required: true },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Judul Fitur',
                  localized: true,
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                  label: 'Deskripsi Fitur',
                  localized: true,
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Home Page',
          fields: [
            {
              name: 'featuredProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Produk Unggulan (Bisa Diurutkan)',
              filterOptions: ({ data, user }: any) => {
                let tenantId = typeof data?.tenant === 'object' ? data.tenant.id : data?.tenant;
                
                if (!tenantId && user?.tenant) {
                  tenantId = typeof user.tenant === 'object' ? user.tenant.id : user.tenant;
                }
                
                if (tenantId) {
                  return {
                    tenant: { equals: tenantId },
                  }
                }
                return true;
              },
              admin: {
                description:
                  'Pilih dan urutkan produk yang akan tampil di bagian Unggulan di halaman depan.',
              },
            },
            {
              name: 'luxuryParallaxImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Gambar Parallax (Khusus Tema Luxury Branded Goods)',
              admin: {
                description: 'Gambar statis ini akan menjadi background dengan efek parallax di homepage untuk tema Luxury Branded Goods.',
              },
            },
          ],
        },
      ],
    },
  ],
}
