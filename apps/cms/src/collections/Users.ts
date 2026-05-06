import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { id: { equals: user?.id } }
    },
    create: ({ req: { user } }) => !!user?.roles?.includes('admin'),
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { id: { equals: user?.id } }
    },
    delete: ({ req: { user } }) => !!user?.roles?.includes('admin'),
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Customer', value: 'customer' },
      ],
      defaultValue: ['admin'],
    },
  ],
}
