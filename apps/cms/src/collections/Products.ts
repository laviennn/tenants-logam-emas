import type { CollectionConfig } from 'payload'
// import { triggerVercelRebuild } from '../utils/rebuild'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'sortOrder', 'price', 'isFeatured'],
  },
  defaultSort: 'sortOrder',
  hooks: {
    // afterChange: [() => triggerVercelRebuild()],
    // afterDelete: [() => triggerVercelRebuild()],
    beforeDelete: [
      async ({ id, req: { payload } }) => {
        // Clean up featuredProducts relationship in Copywriting global
        try {
          const copywriting = await payload.findGlobal({
            slug: 'copywriting',
          })

          if (copywriting?.featuredProducts && copywriting.featuredProducts.length > 0) {
            const updatedFeatured = copywriting.featuredProducts
              .map((p: any) => (typeof p === 'object' ? p.id : p))
              .filter((productId: any) => String(productId) !== String(id))

            if (updatedFeatured.length !== copywriting.featuredProducts.length) {
              await payload.updateGlobal({
                slug: 'copywriting',
                data: {
                  featuredProducts: updatedFeatured,
                },
              })
              console.log(`[Products Hook] Removed product ${id} from Copywriting featured list.`)
            }
          }

          // 2. Clean up associated Reviews
          await payload.delete({
            collection: 'reviews',
            where: {
              product: {
                equals: id,
              },
            },
          })
          console.log(`[Products Hook] Deleted all reviews associated with product ${id}.`)
        } catch (err) {
          console.error(`[Products Hook] Error during product cleanup:`, err)
        }
      },
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: () => true,
  },
  fields: [
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
      type: 'textarea', // Using textarea for simplicity in Astro for now, or Rich Text if needed
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
