import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner } from '../access/tenantAccess'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    group: '📰 Konten',
    defaultColumns: ['title', 'tenant', 'publishDate'],
  },
  access: {
    read: () => true,
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
      admin: {
        condition: (_: any, { user }: any) => isOwner(user),
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'author',
      type: 'text',
    },
    {
      name: 'publishDate',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
