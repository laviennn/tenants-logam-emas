import type { CollectionConfig } from 'payload'
import { ownerOnly, ownerOrTenantAdmin, filterByTenant, assignTenantFromUser } from '../access/tenantAccess'

export const SavingsBalances: CollectionConfig = {
  slug: 'savings-balances',
  admin: {
    useAsTitle: 'customerEmail',
    defaultColumns: ['customerName', 'customerEmail', 'balanceGrams', 'tenant', 'createdAt', 'updatedAt'],
    group: '💰 Tabungan Emas',
  },
  access: {
    read: async ({ req }) => {
      // Allow Payload users (admins/owners)
      if (req.user) {
        if (req.user.roles?.includes('owner')) return true;
        if (req.user.roles?.includes('admin')) return filterByTenant(req.user);
      }
      
      const authHeader = req.headers.get?.('authorization') || (req.headers as any)?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.PUBLIC_SUPABASE_URL || '', process.env.PUBLIC_SUPABASE_ANON_KEY || '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            // Customer can only read their own balance
            return { supabaseUserId: { equals: user.id } } as any;
          }
        } catch (e) {
          console.error('[SavingsBalances] Supabase JWT verification failed', e);
        }
      }
      return false;
    },
    create: ownerOnly,
    update: ownerOrTenantAdmin,
    delete: ownerOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data && (!data.customerName || !data.customerEmail)) {
          try {
            const tenantId = typeof data.tenant === 'object' ? data.tenant?.id : data.tenant;
            const ledgers = await req.payload.find({
              collection: 'savings-ledgers',
              where: {
                supabaseUserId: { equals: data.supabaseUserId },
                tenant: { equals: tenantId },
              },
              sort: '-createdAt',
              limit: 1,
            });
            if (ledgers.docs && ledgers.docs.length > 0) {
              const latestLedger = ledgers.docs[0];
              if (!data.customerName) data.customerName = latestLedger.customerName;
              if (!data.customerEmail) data.customerEmail = latestLedger.customerEmail;
            }
          } catch (e) {
            console.error('[SavingsBalances] beforeChange hook error:', e);
          }
        }
        return data;
      }
    ]
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
      name: 'balanceGrams',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Saldo Emas (Gram)',
    },
  ],
}
