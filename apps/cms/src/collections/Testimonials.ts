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
      name: 'type',
      type: 'select',
      defaultValue: 'text',
      required: true,
      options: [
        { label: 'Teks & Profil (Opsi 1)', value: 'text' },
        { label: 'Screenshot WhatsApp (Opsi 2)', value: 'image_only' }
      ],
      admin: {
        description: 'Pilih tampilan testimoni di halaman website.',
      }
    },
    {
      name: 'reviewerName',
      type: 'text',
      required: false,
      localized: true,
      admin: {
        condition: (data) => data.type === 'text' || !data.type,
      },
    },
    {
      name: 'location',
      type: 'text',
      required: false,
      localized: true,
      admin: {
        description: 'City or Region (e.g., Jakarta, Makassar)',
        condition: (data) => data.type === 'text' || !data.type,
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        condition: (data) => data.type === 'text' || !data.type,
      },
    },
    {
      name: 'starRating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      defaultValue: 5,
      admin: {
        condition: (data) => data.type === 'text' || !data.type,
      },
    },
    {
      name: 'reviewText',
      type: 'textarea',
      required: false,
      localized: true,
      admin: {
        condition: (data) => data.type === 'text' || !data.type,
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      admin: {
        description: 'Photo of the product (Opsi 1) OR WhatsApp Screenshot (Opsi 2)',
      },
    },
  ],
  timestamps: true,
}
