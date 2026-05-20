import type { CollectionConfig } from 'payload'
import { tenantRead, tenantWrite, tenantDelete, assignTenantFromUser } from '../access/tenantAccess'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'tenant', 'isBlocked', 'createdAt'],
    group: '👥 Pelanggan',
  },
  access: {
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantDelete,
  },
  fields: [
    {
      name: 'email',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Alamat email customer.',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Nama Lengkap',
      admin: {
        description: 'Nama lengkap customer.',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
        description: 'Tenant tempat customer terdaftar.',
      },
    },
    {
      name: 'supabaseUserId',
      type: 'text',
      label: 'Supabase User ID',
      admin: {
        description: 'ID pengguna dari sistem otentikasi Supabase.',
      },
    },
    {
      name: 'isBlocked',
      type: 'checkbox',
      label: 'Blokir Akun',
      defaultValue: false,
      admin: {
        description: 'Ceklis untuk memblokir customer ini agar tidak bisa login ke website.',
      },
    },
    {
      name: 'kyc',
      type: 'group',
      label: 'Data KYC (Simpanan Emas)',
      admin: {
        description: 'Data Know Your Customer untuk fitur tabungan emas.',
      },
      fields: [
        {
          name: 'kycType',
          type: 'select',
          label: 'Tipe Identitas',
          options: [
            { label: 'IC (KTP)', value: 'IC' },
            { label: 'Passport', value: 'Passport' },
          ],
        },
        {
          name: 'kycNumber',
          type: 'text',
          label: 'Nomor Identitas',
        },
        {
          name: 'bankName',
          type: 'text',
          label: 'Nama Bank',
        },
        {
          name: 'bankAccountNumber',
          type: 'text',
          label: 'Nomor Rekening Bank',
        },
      ],
    },
  ],
  timestamps: true, // This automatically creates createdAt and updatedAt fields!
}
