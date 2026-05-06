import type { CollectionConfig } from 'payload'
// import { triggerVercelRebuild } from '../utils/rebuild'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
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
      admin: {
        readOnly: true,
      },
    },
  ],
}
