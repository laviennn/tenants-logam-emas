import type { CollectionConfig } from 'payload'
import {  ownerOnly, ownerOrTenantAdmin, filterByTenant, isOwner , assignTenantFromUser } from '../access/tenantAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'tenant'],
    group: '🔐 Pengguna',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isOwner(user)) return true
      return filterByTenant(user)
    },
    create: ownerOrTenantAdmin,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isOwner(user)) return true
      // Tenant admins can only update users in their own tenant
      const tenantId = typeof user.tenant === 'object' ? user.tenant?.id : user.tenant
      if (tenantId) return { tenant: { equals: tenantId } } as any
      return { id: { equals: user.id } } as any
    },
    delete: ownerOnly,
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: '👑 Owner (Super Admin)', value: 'owner' },
        { label: '🛠️ Admin Tenant', value: 'admin' },
        { label: '✏️ Editor', value: 'editor' },
        { label: '🛍️ Customer', value: 'customer' },
      ],
      defaultValue: ['admin'],
      admin: {
        description: 'Owner dapat mengakses semua tenant. Admin hanya bisa akses data tenant-nya.',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: false,
      index: true,
      hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
        description: 'Tenant yang dimiliki user ini. Owner tidak perlu isi field ini.',
        condition: (data) => !data?.roles?.includes('owner'),
      },
    },
  ],
}
