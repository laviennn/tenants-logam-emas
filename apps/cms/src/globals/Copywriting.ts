import type { GlobalConfig } from 'payload'

export const Copywriting: GlobalConfig = {
  slug: 'copywriting',
  label: 'Copywriting Texts',
  admin: {
    group: 'Pengaturan Halaman',
  },
  access: {
    read: () => true,
  },
  fields: [
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
              defaultValue: 'Kami menyediakan pelbagai perkhidmatan terbaik untuk memenuhi keperluan pelaburan emas anda dengan profesional dan dipercayai.',
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
                {
                  name: 'icon',
                  type: 'text',
                  label: 'Ikon (Emoji)',
                  required: true,
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Judul',
                  localized: true,
                  required: true,
                },
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
              defaultValue: 'Kami memiliki keunggulan yang memberikan nilai tambah untuk investasi Anda',
            },
            {
              name: 'whyFeatures',
              type: 'array',
              label: 'Daftar Fitur Why Choose Us',
              minRows: 1,
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  label: 'Ikon (Emoji)',
                  required: true,
                },
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
              admin: {
                description: 'Pilih dan urutkan produk yang akan tampil di bagian Unggulan di halaman depan.',
              },
            },
          ],
        },
      ],
    },
  ],
}
