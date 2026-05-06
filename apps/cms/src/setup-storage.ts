/**
 * Run this once to create the Supabase Storage bucket for payment proofs.
 * Usage: npx tsx --env-file=../../.env setup-storage.ts
 * (Run from apps/cms directory)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing env vars. Ensure PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setup() {
  console.log('🔧  Setting up Supabase Storage...');

  // 1. Create bucket
  const { data, error } = await admin.storage.createBucket('payment-proofs', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅  Bucket payment-proofs already exists.');
    } else {
      console.error('❌  Failed to create bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅  Bucket payment-proofs created successfully.');
  }

  // 2. Apply a policy that allows any anon user to INSERT (upload)
  const policySQL = `
    CREATE POLICY IF NOT EXISTS "Allow public uploads"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (bucket_id = 'payment-proofs');
  `;

  // Note: Supabase JS SDK does not expose RLS policy creation directly.
  // You must run the SQL below in your Supabase SQL Editor.
  console.log('\n📋  IMPORTANT: Apply this SQL in your Supabase SQL Editor to allow anon uploads:');
  console.log('─'.repeat(70));
  console.log(policySQL.trim());
  console.log('─'.repeat(70));
  console.log('\n✅  Storage setup complete!');
}

setup().catch(console.error);
