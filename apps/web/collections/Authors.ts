import type { CollectionConfig } from 'payload'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'trending'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'role',
      type: 'text',
      admin: {
        description: 'e.g. "Social Psychologist", "Environmental Scientist", "Product Designer"',
      },
    },
    {
      name: 'trending',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this author in the "Trending writers" section',
      },
    },
    {
      name: 'followers',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Number of followers',
      },
    },
  ],
}
