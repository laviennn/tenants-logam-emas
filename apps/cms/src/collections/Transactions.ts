import type { CollectionConfig } from 'payload'
import { tenantWrite, isOwner, tenantRead, assignTenantFromUser } from '../access/tenantAccess'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'orderId',
    description: 'Transaksi yang dibuat oleh pelanggan saat checkout.',
    defaultColumns: ['orderId', 'tenant', 'customerDetails_name', 'total', 'status', 'createdAt'],
    group: '💼 Penjualan',
  },
  access: {
    read: tenantRead,
    create: () => true, // Frontend checkout posts here
    update: tenantWrite,
    delete: tenantWrite,
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
        readOnly: true,
        description: 'Diisi otomatis dari frontend saat checkout.',
      },
    },
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
        { name: 'address', type: 'textarea', label: 'Alamat Lengkap' },
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
        { name: 'priceAtPurchase', type: 'number', label: 'Harga saat beli (Nominal)' },
      ],
    },
    { name: 'shippingMethod', type: 'text', label: 'Jasa Pengiriman' },
    { name: 'shippingCost', type: 'number', label: 'Ongkos Kirim (Nominal)', defaultValue: 0 },
    { name: 'paymentChannel', type: 'text', label: 'Channel Pembayaran (Bank)' },
    { name: 'subtotal', type: 'number', label: 'Subtotal (Nominal)', required: true },
    { name: 'total', type: 'number', label: 'Total Transaksi (Nominal)', required: true },
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
        console.log(
          `[Transactions] ${doc.orderId} | Status: ${doc.status} | Total: ${doc.total?.toLocaleString()}`,
        )
      },
    ],
  },
}
