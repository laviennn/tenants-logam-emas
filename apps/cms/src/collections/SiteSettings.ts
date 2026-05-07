import type { CollectionConfig } from 'payload'
import {  tenantWrite, tenantDelete, isOwner, tenantRead, filterByTenant, assignTenantFromUser } from '../access/tenantAccess'

export const SiteSettings: CollectionConfig = {
  slug: 'site-settings',
  admin: {
    useAsTitle: 'brandName',
    group: '⚙️ Pengaturan',
    defaultColumns: ['brandName', 'tenant', 'updatedAt'],
    description: 'Pengaturan situs per tenant: SEO, kontak, pembayaran, pengiriman.',
  },
  access: {
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantDelete,
  },
  fields: [
    // ── Tenant ───────────────────────────────────────────────
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
        description: 'Tenant yang dimiliki settings ini.',
      },
    },

    // ── Brand ─────────────────────────────────────────────────
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Logo',
    },
    {
      name: 'faviconSvg',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Favicon (SVG)',
      admin: {
        description: 'Ikon browser dalam format SVG (Modern).',
      },
    },
    {
      name: 'faviconIco',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Favicon (ICO)',
      admin: {
        description: 'Ikon browser dalam format ICO (Kompatibilitas lama).',
      },
    },
    {
      name: 'brandName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Logam Mulia Gold Antam',
      admin: {
        description: 'Nama brand untuk Navbar, Footer, dan Copyright',
      },
    },

    // ── SEO ──────────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: '🔍 SEO & Meta',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              required: true,
              localized: true,
              defaultValue: 'Logam Mulia Gold Antam',
              label: 'Meta Title',
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              localized: true,
              required: false,
              label: 'Meta Description',
            },
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              required: false,
              label: 'Open Graph Image',
              admin: {
                description: 'Gambar OG untuk social sharing. Ukuran ideal 1200x630px. Jika kosong, akan menggunakan gambar default.',
              },
            },
            {
              name: 'googleSearchConsoleCode',
              type: 'text',
              required: false,
              label: 'Google Search Console Verification Code',
            },
            {
              name: 'googleAnalyticsId',
              type: 'text',
              required: false,
              label: 'Google Analytics ID (G-XXXXXXXX)',
            },
          ],
        },
        {
          label: '📞 Kontak',
          fields: [
            {
              name: 'whatsappNumber',
              type: 'text',
              required: true,
              defaultValue: '6281234567890',
              label: 'Nomor WhatsApp',
              admin: {
                description: 'Mulai dengan kode negara, contoh: 6281234567890',
              },
            },
            {
              name: 'email',
              type: 'text',
              required: false,
              label: 'Email Support',
            },
            {
              name: 'address',
              type: 'textarea',
              localized: true,
              label: 'Alamat',
            },
            {
              name: 'footerAbout',
              type: 'textarea',
              localized: true,
              label: 'Deskripsi Footer (Tentang Kami)',
              admin: {
                description: 'Teks singkat di bagian footer.',
              },
            },
          ],
        },
        {
          label: '🚚 Pengiriman',
          fields: [
            {
              name: 'shippingMethods',
              type: 'array',
              localized: true,
              label: 'Metode Pengiriman',
              fields: [
                { name: 'name', type: 'text', required: true, label: 'Nama Ekspedisi (JNE, J&T, dll)' },
                { name: 'price', type: 'number', required: true, label: 'Ongkos Kirim Flat (Rp)' },
              ],
            },
          ],
        },
        {
          label: '💳 Pembayaran',
          fields: [
            {
              name: 'paymentChannels',
              type: 'array',
              localized: true,
              label: 'Channel Pembayaran',
              fields: [
                { name: 'bankName', type: 'text', required: true, label: 'Nama Bank / e-Wallet' },
                { name: 'accountName', type: 'text', required: true, label: 'Atas Nama' },
                { name: 'accountNumber', type: 'text', required: true, label: 'Nomor Rekening' },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  required: false,
                  label: 'Logo Bank',
                },
              ],
            },
          ],
        },
        {
          label: '📱 Social Media',
          fields: [
            {
              name: 'facebook',
              type: 'text',
              required: false,
              label: 'URL Facebook',
              admin: { description: 'Contoh: https://facebook.com/namapage' },
            },
            {
              name: 'instagram',
              type: 'text',
              required: false,
              label: 'URL Instagram',
              admin: { description: 'Contoh: https://instagram.com/namaakun' },
            },
            {
              name: 'twitter',
              type: 'text',
              required: false,
              label: 'URL X / Twitter',
              admin: { description: 'Contoh: https://x.com/namaakun' },
            },
            {
              name: 'tiktok',
              type: 'text',
              required: false,
              label: 'URL TikTok',
              admin: { description: 'Contoh: https://tiktok.com/@namaakun' },
            },
          ],
        },
      ],
    },
  ],
}
