import type { CollectionConfig } from 'payload'
import { ownerOnly, ownerOrTenantAdmin, filterByTenant, assignTenantFromUser } from '../access/tenantAccess'

export const SavingsLedgers: CollectionConfig = {
  slug: 'savings-ledgers',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['customerName', 'customerEmail', 'transactionType', 'amount', 'status', 'createdAt', 'updatedAt'],
    group: '💰 Tabungan Emas',
  },
  access: {
    read: async ({ req }) => {
      // Allow Payload users
      if (req.user) {
        if (req.user.roles?.includes('owner')) return true;
        if (req.user.roles?.includes('admin')) return filterByTenant(req.user);
      }
      
      // Allow Supabase customers
      const authHeader = req.headers.get?.('authorization') || (req.headers as any)?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.PUBLIC_SUPABASE_URL || '', process.env.PUBLIC_SUPABASE_ANON_KEY || '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            return { supabaseUserId: { equals: user.id } } as any;
          }
        } catch (e) {
          console.error('[SavingsLedgers] Supabase JWT verification failed', e);
        }
      }
      return false;
    },
    // Any logged in user (Payload or Supabase) can create a ledger (pending status)
    create: async ({ req }) => {
      // Allow Payload users
      if (req.user) return true;
      
      // Allow Supabase customers
      const authHeader = req.headers.get?.('authorization') || (req.headers as any)?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.PUBLIC_SUPABASE_URL || '', process.env.PUBLIC_SUPABASE_ANON_KEY || '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) return true;
        } catch (e) {
          console.error('[SavingsLedgers] Create: Supabase JWT verification failed', e);
        }
      }
      return false;
    },
    update: ownerOrTenantAdmin,
    delete: ownerOnly,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      hooks: {
        beforeValidate: [assignTenantFromUser],
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'supabaseUserId',
      type: 'text',
      required: true,
      index: true,
      label: 'Supabase User ID',
      admin: {
        description: 'ID pengguna dari sistem otentikasi Supabase.',
      }
    },
    {
      name: 'customerName',
      type: 'text',
      label: 'Nama Pelanggan',
    },
    {
      name: 'customerEmail',
      type: 'text',
      label: 'Email Pelanggan',
    },
    {
      name: 'transactionType',
      type: 'select',
      required: true,
      label: 'Tipe Transaksi',
      options: [
        { label: 'Top Up Saldo (Gram)', value: 'top_up' },
        { label: 'Beli Emas (Gram)', value: 'buy' },
        { label: 'Jual Emas (Gram)', value: 'sell' },
        { label: 'Tarik Fisik (Gram)', value: 'withdraw_physical' },
        { label: 'Tarik Dana (Fiat)', value: 'withdraw_fiat' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Jumlah',
      admin: {
        description: 'Bisa berupa Gram atau Fiat tergantung tipe transaksi.',
      }
    },
    {
      name: 'priceSnapshot',
      type: 'number',
      label: 'Harga Snapshot Saat Transaksi',
      admin: {
        description: 'Mencatat harga emas saat transaksi dilakukan.',
      }
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Status Transaksi',
      options: [
        { label: 'Menunggu (Pending)', value: 'pending' },
        { label: 'Disetujui (Approved)', value: 'approved' },
        { label: 'Ditolak (Rejected)', value: 'rejected' },
      ],
    },
    {
      name: 'paymentProof',
      type: 'upload',
      relationTo: 'media',
      label: 'Bukti Pembayaran (Top Up)',
      admin: {
        description: 'Foto bukti transfer pembayaran untuk transaksi Top Up.',
      }
    },
    {
      name: 'shippingAddress',
      type: 'textarea',
      label: 'Alamat Pengiriman (Tarik Fisik)',
    },
    {
      name: 'shippingMethod',
      type: 'text',
      label: 'Metode Pengiriman (Tarik Fisik)',
    },
    {
      name: 'bankName',
      type: 'text',
      label: 'Nama Bank (Withdraw / Jual)',
    },
    {
      name: 'accountNumber',
      type: 'text',
      label: 'Nomor Rekening (Withdraw / Jual)',
    },
    {
      name: 'accountName',
      type: 'text',
      label: 'Atas Nama Rekening',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status === 'approved' && previousDoc?.status !== 'approved') {
          const { payload } = req
          const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant

          const balances = await payload.find({
            collection: 'savings-balances',
            where: {
              supabaseUserId: { equals: doc.supabaseUserId },
              tenant: { equals: tenantId },
            },
            limit: 1,
          })

          let balanceDoc = balances.docs[0]
          let currentBalance = balanceDoc ? balanceDoc.balanceGrams : 0

          let amountChange = 0
          if (doc.transactionType === 'buy') {
            amountChange = doc.amount
          } else if (['sell', 'withdraw_physical', 'withdraw_fiat'].includes(doc.transactionType)) {
            amountChange = -doc.amount
          }

          if (amountChange !== 0) {
            const newBalance = currentBalance + amountChange
            if (balanceDoc) {
              await payload.update({
                collection: 'savings-balances',
                id: balanceDoc.id,
                data: {
                  balanceGrams: newBalance,
                  customerName: doc.customerName || balanceDoc.customerName,
                  customerEmail: doc.customerEmail || balanceDoc.customerEmail,
                },
              })
            } else {
              await payload.create({
                collection: 'savings-balances',
                data: {
                  tenant: tenantId,
                  supabaseUserId: doc.supabaseUserId,
                  balanceGrams: newBalance,
                  customerName: doc.customerName,
                  customerEmail: doc.customerEmail,
                },
              })
            }
          }
        }
      },
    ],
  },
}
