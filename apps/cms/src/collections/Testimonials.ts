import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'reviewerName',
    defaultColumns: ['reviewerName', 'tenant', 'location', 'starRating', 'createdAt'],
    group: '📰 Konten',
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
      name: 'reviewerName',
      type: 'text',
      required: false,
      localized: true,
    },
    {
      name: 'location',
      type: 'text',
      required: false,
      localized: true,
      admin: {
        description: 'City or Region (e.g., Jakarta, Makassar)',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'starRating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: 'reviewText',
      type: 'textarea',
      required: false,
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Photo of the product or testimony',
      },
    },
  ],
  timestamps: true,
}
