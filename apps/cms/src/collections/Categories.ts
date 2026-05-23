import type { CollectionConfig } from 'payload'
import { tenantWrite, tenantDelete, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

const TENANT_FIELD = {
  name: 'tenant',
  type: 'relationship' as const,
  relationTo: 'tenants' as const,
  required: true,
  index: true,
  label: 'Tenant',
  hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
    condition: (_data: any, _siblingData: any, { user }: any) => isOwner(user),
    description: 'Tenant pemilik kategori ini.',
  },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tenant', 'sortOrder', 'image'],
    group: '🛒 Katalog',
  },
  defaultSort: 'sortOrder',
  access: {
    read: tenantRead,
    create: tenantWrite,
    update: tenantWrite,
    delete: tenantDelete,
  },
  fields: [
    TENANT_FIELD,
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      admin: {
        description: 'Pilih kategori induk jika ini adalah sub-kategori.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'showOnHomepage',
      type: 'checkbox',
      defaultValue: false,
      label: 'Tampilkan di Homepage',
      admin: {
        description: 'Aktifkan untuk menampilkan kategori ini di Homepage (Maksimal 3 kategori akan ditampilkan).',
      },
    },
    {
      name: 'hideFromNavbar',
      type: 'checkbox',
      defaultValue: false,
      label: 'Sembunyikan Kategori Ini dari Navbar',
      admin: {
        description: 'Jika diaktifkan, kategori tidak akan muncul di Navbar. (Hanya berlaku untuk Kategori Utama. Sub-kategori tetap tampil jika parent-nya tampil)',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Urutan tampilan (kecil ke besar)',
      },
    },
  ],
}
