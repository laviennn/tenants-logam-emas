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
              defaultValue: '#1e1e1e',
            },
            {
              name: 'productTitleColor',
              type: 'text',
              label: 'Warna Nama Produk (Hex)',
              defaultValue: '#1e1e1e',
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
          ],
        },
      ],
    },
  ],
}
