import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner } from '../access/tenantAccess'

const TENANT_FIELD = {
  name: 'tenant',
  type: 'relationship' as const,
  relationTo: 'tenants' as const,
  required: true,
  index: true,
  label: 'Tenant',
  admin: {
    condition: (_: any, { user }: any) => isOwner(user),
    description: 'Tenant pemilik kategori ini.',
  },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tenant', 'sortOrder', 'image'],
    group: '🛒 Katalog',
  },
  defaultSort: 'sortOrder',
  access: {
    read: () => true,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantDelete,
  },
  fields: [
    TENANT_FIELD,
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Urutan tampilan (kecil ke besar)',
      },
    },
  ],
}
