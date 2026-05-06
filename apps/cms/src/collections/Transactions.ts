import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'orderId',
    description: 'Transaksi yang dibuat oleh pelanggan saat checkout.',
    defaultColumns: ['orderId', 'customerDetails_name', 'total', 'status', 'createdAt'],
    group: 'Penjualan',
  },
  access: {
    read: () => true,
    create: () => true, // Allows frontend checkout to POST
    update: ({ req: { user } }) => !!user, // Only admin can update
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'orderId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Generated automatically at checkout' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: '⏳ Menunggu Konfirmasi', value: 'Pending' },
        { label: '✅ Pembayaran Dikonfirmasi', value: 'Paid' },
        { label: '🚚 Dikirim', value: 'Shipped' },
        { label: '🎉 Selesai', value: 'Completed' },
        { label: '❌ Dibatalkan', value: 'Cancelled' },
      ],
      defaultValue: 'Pending',
      required: true,
    },
    {
      name: 'customerDetails',
      type: 'group',
      label: 'Data Pelanggan',
      fields: [
        { name: 'name', type: 'text', label: 'Nama Lengkap' },
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'phone', type: 'text', label: 'No. WhatsApp' },
        {
          name: 'address',
          type: 'textarea',
          label: 'Alamat Lengkap',
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Item Pesanan',
      admin: { readOnly: true },
      fields: [
        { name: 'productId', type: 'text', label: 'Product ID' },
        { name: 'productName', type: 'text', label: 'Nama Produk' },
        { name: 'quantity', type: 'number', label: 'Jumlah' },
        { name: 'priceAtPurchase', type: 'number', label: 'Harga saat beli (Rp)' },
      ],
    },
    {
      name: 'shippingMethod',
      type: 'text',
      label: 'Jasa Pengiriman',
    },
    {
      name: 'shippingCost',
      type: 'number',
      label: 'Ongkos Kirim (Rp)',
      defaultValue: 0,
    },
    {
      name: 'paymentChannel',
      type: 'text',
      label: 'Channel Pembayaran (Bank)',
    },
    {
      name: 'subtotal',
      type: 'number',
      label: 'Subtotal (Rp)',
      required: true,
    },
    {
      name: 'total',
      type: 'number',
      label: 'Total Transaksi (Rp)',
      required: true,
    },
    {
      name: 'paymentProofUrl',
      type: 'text',
      label: 'URL Bukti Pembayaran',
      admin: { description: 'URL dari Supabase Storage (diisi otomatis)' },
    },
    {
      name: 'trackingNumber',
      type: 'text',
      label: 'Nomor Resi',
      admin: { description: 'Masukkan Nomor Resi jika pesanan sudah dikirim' },
    },
    {
      name: 'supabaseUserId',
      type: 'text',
      label: 'Supabase User ID',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        console.log(`[Transactions] New/updated transaction: ${doc.orderId} | Status: ${doc.status} | Total: Rp ${doc.total?.toLocaleString('id-ID')}`);
      }
    ]
  }
}
