import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

export const GoldPrice: CollectionConfig = {
  slug: 'gold-price',
  admin: {
    useAsTitle: 'tenant',
    group: '⚙️ Pengaturan',
    defaultColumns: ['tenant', 'currentPrice', 'updatedAt'],
    description: 'Harga emas live per tenant.',
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
      name: 'currentPrice',
      type: 'number',
      required: true,
      defaultValue: 1500000,
      label: 'Harga Emas Saat Ini (per gram, Nominal)',
    },
    {
      name: 'strikePrice',
      type: 'number',
      label: 'Harga Coret (Nominal)',
      admin: {
        description: 'Harga asli sebelum diskon untuk tampilan coret.',
      },
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
      label: 'Jumlah Diskon (Nominal)',
    },
  ],
}
