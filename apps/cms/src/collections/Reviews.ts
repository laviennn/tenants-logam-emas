import type { CollectionConfig } from 'payload'
// import { triggerVercelRebuild } from '../utils/rebuild'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'userName',
    defaultColumns: ['userName', 'product', 'rating', 'createdAt'],
  },
  hooks: {
    // afterChange: [() => triggerVercelRebuild()],
    // afterDelete: [() => triggerVercelRebuild()],
  },
  access: {
    read: () => true,
    create: () => true, // Anyone can submit a review
    update: ({ req: { user } }) => !!user, // Only admins can update
    delete: ({ req: { user } }) => !!user, // Only admins can delete
  },
  fields: [
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
