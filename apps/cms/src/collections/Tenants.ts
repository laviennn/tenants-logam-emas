import type { CollectionConfig } from 'payload'
import { ownerOnly, tenantsRead, assignTenantFromUser, isOwner } from '../access/tenantAccess'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: '🏢 Manajemen Tenant',
    defaultColumns: ['name', 'slug', 'isActive', 'primaryDomain'],
    description: 'Kelola semua tenant (website) dalam sistem. Hanya Owner yang bisa mengakses menu ini.',
    hidden: ({ user }) => !isOwner(user),
  },
  access: {
    read: tenantsRead,
    create: ownerOnly,
    update: ownerOnly,
    delete: ownerOnly,
  },
  fields: [
    // ── Identity ─────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nama Brand / Website',
      admin: { description: 'Contoh: Logam Mulia Antam' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug (Identifier Unik)',
      admin: { description: 'Contoh: logam-mulia-antam. Tidak boleh ada spasi.' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktif',
    },

    // ── Domains ──────────────────────────────────────────────
    {
      name: 'domains',
      type: 'array',
      label: 'Daftar Domain',
      required: true,
      admin: {
        description: 'Tambahkan semua domain yang dipakai tenant ini (termasuk www dan non-www). Index digunakan untuk query cepat.',
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
          label: 'Domain (tanpa https://)',
          admin: { description: 'Contoh: www.logammulia-antam.com atau localhost:4321' },
        },
      ],
    },
    {
      name: 'primaryDomain',
      type: 'text',
      label: 'Domain Utama',
      admin: { description: 'Domain utama untuk canonical URL. Contoh: www.logammulia-antam.com' },
    },

    // ── Styling ──────────────────────────────────────────────
    {
      type: 'tabs',
      tabs: [
        {
          label: '🎨 Tema & Warna',
          fields: [
            {
              name: 'theme_layout',
              type: 'select',
              label: 'Tema & Layout Halaman',
              defaultValue: 'default',
              options: [
                { label: 'Default', value: 'default' },
                { label: 'Luxury (Premium)', value: 'luxury' },
                { label: 'Luxury (Branded Goods)', value: 'luxury-branded' },
              ],
              admin: { description: 'Pilih layout utama untuk website ini' },
            },
            {
              name: 'primaryColor',
              type: 'text',
              label: 'Warna Primary (Hex)',
              defaultValue: '#D4AF37',
              admin: { description: 'Warna utama brand. Contoh: #D4AF37' },
            },
            {
              name: 'primaryDarkColor',
              type: 'text',
              label: 'Warna Primary Dark (Hex)',
              defaultValue: '#b5952f',
            },
            {
              name: 'secondaryColor',
              type: 'text',
              label: 'Warna Secondary (Hex)',
              defaultValue: '#FFDF00',
            },
            {
              name: 'backgroundDarkColor',
              type: 'text',
              label: 'Background Dark Mode (Hex)',
              defaultValue: '#121212',
            },
            {
              name: 'surfaceDarkColor',
              type: 'text',
              label: 'Surface Dark Mode (Hex)',
              defaultValue: '#1e1e1e',
            },
            {
              name: 'navbarBgColor',
              type: 'text',
              label: 'Warna Background Navbar (Hex)',
              defaultValue: '#D4AF37',
              admin: { description: 'Default sama dengan primary color' },
            },
            {
              name: 'buttonColor',
              type: 'text',
              label: 'Warna Tombol Utama (Hex)',
              defaultValue: '#D4AF37',
            },
            {
              name: 'cartButtonColor',
              type: 'text',
              label: 'Warna Tombol Keranjang (Hex)',
              defaultValue: '#D4AF37',
              admin: { description: 'Warna tombol Add to Cart dan Checkout' }
            },
            {
              name: 'cartTextColor',
              type: 'text',
              label: 'Warna Teks Keranjang (Hex)',
              admin: { description: 'Kosongkan untuk otomatis menyesuaikan Light/Dark Mode' },
            },
            {
              name: 'productTitleColor',
              type: 'text',
              label: 'Warna Nama Produk (Hex)',
              admin: { description: 'Kosongkan untuk otomatis menyesuaikan Light/Dark Mode' },
            },
            {
              name: 'productPriceColor',
              type: 'text',
              label: 'Warna Harga Produk (Hex)',
              defaultValue: '#d97706',
            },
            {
              name: 'fontFamily',
              type: 'select',
              label: 'Font Family',
              defaultValue: 'Inter',
              options: [
                { label: 'Inter (Default)', value: 'Inter' },
                { label: 'Poppins', value: 'Poppins' },
                { label: 'Roboto', value: 'Roboto' },
                { label: 'Outfit', value: 'Outfit' },
                { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
                { label: 'Nunito', value: 'Nunito' },
                { label: 'Fjalla One', value: 'Fjalla One' },
              ],
            },
            {
              name: 'successButtonColor',
              type: 'text',
              label: 'Warna Button Success & Form (Hex)',
              defaultValue: '#25D366',
              admin: { description: 'Warna untuk tombol di modal success & form upload bukti.' },
            },
            {
              name: 'heroSlider',
              type: 'array',
              label: 'Hero Slider (Khusus Branded Goods)',
              maxRows: 3,
              admin: {
                description: 'Upload maksimal 3 gambar untuk slider hero di halaman utama.',
                condition: (data) => data.theme_layout === 'luxury-branded',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                  label: 'Gambar Slide',
                },
                {
                  name: 'title',
                  type: 'text',
                  label: 'Judul/Teks Slide (Opsional)',
                  admin: {
                    description: 'Teks yang akan muncul di atas gambar slider.',
                  },
                },
                {
                  name: 'textColor',
                  type: 'text',
                  label: 'Warna Teks (Hex)',
                  defaultValue: '#FFFFFF',
                  admin: {
                    description: 'Warna teks judul slide. Default: #FFFFFF (Putih).',
                  },
                },
              ],
            },
          ],
        },
        {
          label: '⚙️ Advanced',
          fields: [
            {
              name: 'vercelDeployHookUrl',
              type: 'text',
              label: 'Vercel Deploy Hook URL',
              admin: {
                description: 'URL untuk trigger rebuild Vercel saat konten berubah.',
              },
            },
            {
              name: 'cloudflareDeployHookUrl',
              type: 'text',
              label: 'Cloudflare Deploy Hook URL',
              admin: {
                description: 'URL untuk trigger rebuild Cloudflare Pages saat konten berubah.',
              },
            },
            {
              name: 'enableGoldSavings',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable Gold Savings (AKUAN)',
              admin: {
                description: 'Aktifkan fitur Tabungan Emas (Dashboard Simpanan) untuk tenant ini.',
              },
            },
            {
              name: 'enableDarkMode',
              type: 'checkbox',
              defaultValue: true,
              label: 'Enable Dark Mode',
              admin: {
                description: 'Aktifkan fitur Dark Mode di website front-end.',
              },
            },
            {
              name: 'savingsMemberIdPrefix',
              type: 'text',
              label: 'Prefix ID Anggota (Tabungan Emas)',
              admin: {
                description: 'Prefix kustom untuk ID Anggota Tabungan Emas (misal: CGM). Jika kosong, akan menggunakan inisial dari Brand Name atau AKUAN.',
              },
            },
            {
              name: 'savingsGoldSymbol',
              type: 'text',
              label: 'Simbol / Label Emas Tabungan',
              admin: {
                description: 'Label kustom untuk nama/simbol emas tabungan (misal: GAP). Jika kosong, akan menggunakan GAP.',
              },
            },
            {
              name: 'showWhatsAppBuyButton',
              type: 'checkbox',
              defaultValue: false,
              label: 'Tampilkan Tombol Beli via WhatsApp',
              admin: {
                description: 'Aktifkan tombol "Beli via WA" pada setiap kartu produk di beranda dan halaman produk.',
              },
            },
            {
              name: 'enableTwoColumnGridMobile',
              type: 'checkbox',
              defaultValue: false,
              label: 'Tampilan 2 Kolom di Mobile (Halaman Produk)',
              admin: {
                description: 'Jika diaktifkan, tampilan produk di halaman /products untuk perangkat mobile akan menjadi 2 kolom. Default adalah 1 kolom.',
              },
            },
            {
              name: 'enableAnnouncement',
              type: 'checkbox',
              defaultValue: false,
              label: 'Aktifkan Text diatas Navbar (Announcement Bar)',
              admin: {
                description: 'Jika diaktifkan, akan menampilkan text/pengumuman diatas navbar.',
              },
            },
            {
              name: 'announcementText',
              type: 'text',
              label: 'Text Pengumuman',
              admin: {
                description: 'Text yang akan ditampilkan di baris pengumuman. Contoh: Gratis Ongkir Seluruh Indonesia',
                condition: (data) => data.enableAnnouncement === true,
              },
            },
            {
              name: 'announcementLink',
              type: 'text',
              label: 'Link Pengumuman (Opsional)',
              admin: {
                description: 'Link tujuan saat text pengumuman diklik. Contoh: /products atau link eksternal.',
                condition: (data) => data.enableAnnouncement === true,
              },
            },
            {
              name: 'enableCustomerReviews',
              type: 'checkbox',
              defaultValue: true,
              label: 'Aktifkan Ulasan Pelanggan (Customer Reviews)',
              admin: {
                description: 'Jika dinonaktifkan, ulasan pelanggan (bintang, total ulasan, list review) di halaman detail produk akan disembunyikan. Default aktif.',
              },
            },
          ],
        },
        {
          label: '📖 Copywriting Panduan',
          fields: [
            {
              name: 'guideTitle',
              type: 'text',
              label: 'Judul Panduan',
              defaultValue: 'Panduan Tabungan Emas',
              admin: {
                description: 'Judul halaman panduan tabungan emas.',
              },
            },
            {
              name: 'guideContent',
              type: 'richText',
              label: 'Konten Panduan',
              admin: {
                description: 'Tulis panduan tabungan emas menggunakan rich text editor.',
              },
            },
          ],
        },
      ],
    },
  ],
}
