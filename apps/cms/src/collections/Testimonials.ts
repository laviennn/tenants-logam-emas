import type { CollectionConfig } from 'payload'
// import { triggerVercelRebuild } from '../utils/rebuild'

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'reviewerName',
    defaultColumns: ['reviewerName', 'location', 'starRating', 'createdAt'],
  },
  hooks: {
    // afterChange: [() => triggerVercelRebuild()],
    // afterDelete: [() => triggerVercelRebuild()],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
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
      admin: {
        description: 'Profile picture of the reviewer',
      },
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
