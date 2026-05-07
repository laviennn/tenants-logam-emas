import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: '📁 Media',
    defaultColumns: ['filename', 'tenant', 'alt', 'updatedAt'],
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
      required: false, // Optional since some media is shared (OG images, logos)
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
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'large',
        width: 1600,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
}
