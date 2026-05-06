import type { CollectionConfig } from 'payload'
import { tenantWrite, isOwner } from '../access/tenantAccess'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'userName',
    defaultColumns: ['userName', 'tenant', 'product', 'rating', 'createdAt'],
    group: '📰 Konten',
  },
  access: {
    read: () => true,
    create: () => true, // Public can submit reviews
    update: tenantWrite,
    delete: tenantWrite,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      label: 'Tenant',
      admin: {
        condition: (_: any, { user }: any) => isOwner(user),
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      hasMany: false,
    },
    {
      name: 'userName',
      type: 'text',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional testimonial image',
      },
    },
  ],
  timestamps: true,
}
