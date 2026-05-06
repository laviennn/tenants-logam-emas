import type { CollectionConfig } from 'payload'
import {  tenantWrite, tenantDelete, isOwner , assignTenantFromUser } from '../access/tenantAccess'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'tenant', 'category', 'sortOrder', 'price', 'isFeatured'],
    group: '🛒 Katalog',
  },
  defaultSort: 'sortOrder',
  hooks: {
    beforeDelete: [
      async ({ id, req: { payload } }) => {
        // Clean up featuredProducts relationship in Copywriting collection
        try {
          const copywritings = await payload.find({
            collection: 'copywriting',
            where: { 'featuredProducts': { contains: id } },
            limit: 100,
          })
          for (const cw of copywritings.docs) {
            const updatedFeatured = (cw.featuredProducts || [])
              .map((p: any) => (typeof p === 'object' ? p.id : p))
              .filter((productId: any) => String(productId) !== String(id))
            await payload.update({
              collection: 'copywriting',
              id: cw.id,
              data: { featuredProducts: updatedFeatured },
            })
          }
          // Clean up associated Reviews
          await payload.delete({
            collection: 'reviews',
            where: { product: { equals: id } },
          })
        } catch (err) {
          console.error(`[Products Hook] Error during product cleanup:`, err)
        }
      },
    ],
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
      hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
        condition: (_data: any, _siblingData: any, { user }: any) => isOwner(user),
        description: 'Tenant pemilik produk ini.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Gambar Utama',
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Galeri Gambar Tambahan',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: 'Deskripsi Produk',
    },
    {
      name: 'stock',
      type: 'number',
      required: true,
      defaultValue: 10,
      label: 'Stok Produk',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'strikePrice',
      type: 'number',
      label: 'Harga Coret (Opsional)',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Tampilkan sebagai Produk Unggulan',
      defaultValue: false,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'soldCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'rating',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 5,
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
