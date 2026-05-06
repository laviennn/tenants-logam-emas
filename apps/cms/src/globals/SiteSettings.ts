import type { GlobalConfig } from 'payload'
// import { triggerVercelRebuild } from '../utils/rebuild'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  hooks: {
    // afterChange: [() => triggerVercelRebuild()],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'brandName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Logam Mulia Gold Antam',
      admin: {
        description: 'Brand name for Navbar, Footer, and Copyright',
      },
    },
    {
      name: 'metaTitle',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Logam Mulia Gold Antam',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      required: false,
    },
    {
      name: 'footerAbout',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Copywriting for the About Us section in the Footer',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      required: true,
      defaultValue: '6281234567890',
      admin: {
        description: 'Global WhatsApp number (start with country code, e.g., 62812...)',
      },
    },
    {
      name: 'email',
      type: 'text',
      required: true,
      defaultValue: 'support@logam-muliagold-antam.com',
    },
    {
      name: 'address',
      type: 'textarea',
      localized: true,
      defaultValue: 'Jakarta, Indonesia',
    },
    {
      name: 'googleSearchConsoleCode',
      type: 'text',
      required: false,
    },
    {
      name: 'googleAnalyticsId',
      type: 'text',
      required: false,
    },

    {
      name: 'shippingMethods',
      type: 'array',
      localized: true,
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Nama Ekspedisi (JNE, J&T, dll)' },
        { name: 'price', type: 'number', required: true, label: 'Ongkos Kirim Flat (Rp)' },
      ],
    },
    {
      name: 'paymentChannels',
      type: 'array',
      localized: true,
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
}
