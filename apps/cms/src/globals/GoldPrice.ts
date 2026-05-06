import type { GlobalConfig } from 'payload'

export const GoldPrice: GlobalConfig = {
  slug: 'gold-price',
  label: 'Live Gold Price',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'currentPrice',
      type: 'number',
      required: true,
      defaultValue: 1500000,
      admin: {
        description: 'Current price of 1 gram of gold (in IDR)',
      },
    },
    {
      name: 'strikePrice',
      type: 'number',
      admin: {
        description: 'Original price (harga coret) for display (in IDR)',
      },
    },
    {
      name: 'discount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Discount amount (in IDR)',
      },
    },
  ],
}
