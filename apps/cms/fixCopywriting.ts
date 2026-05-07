// File: apps/cms/fixCopywriting.ts
import dotenv from 'dotenv';
dotenv.config();

import { getPayload } from 'payload';

function sanitizeData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  } else if (data !== null && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (['id', 'tenant', 'createdAt', 'updatedAt', 'sizes'].includes(key)) {
        continue;
      }
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}

async function fixCopywriting() {
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  console.log('🔍 Mengambil data copywriting original (ID: 1)...');
  const original = await payload.findByID({
    collection: 'copywriting',
    id: 1,
    overrideAccess: true,
    depth: 0,
  });

  if (!original) {
    console.error('❌ Data ID 1 tidak ditemukan!');
    process.exit(1);
  }

  const cleanData = sanitizeData(original);

  // 1. Update ID 1 ke Tenant 2
  console.log('🔄 Mengassign ID: 1 ke Tenant 2...');
  await payload.update({
    collection: 'copywriting',
    id: 1,
    data: { ...cleanData, tenant: 2 },
    overrideAccess: true,
  });

  // 2. Cek apakah Tenant 4 sudah punya data
  const existingT4 = await payload.find({
    collection: 'copywriting',
    where: { tenant: { equals: 4 } },
    overrideAccess: true,
  });

  if (existingT4.docs.length === 0) {
    console.log('➕ Menduplikasi data ke Tenant 4...');
    await payload.create({
      collection: 'copywriting',
      data: { ...cleanData, tenant: 4 },
      overrideAccess: true,
    });
  } else {
    console.log('ℹ️ Tenant 4 sudah memiliki data copywriting, melewati duplikasi.');
  }

  console.log('✅ Selesai! Copywriting sekarang terhubung ke Tenant 2 dan Tenant 4.');
  process.exit(0);
}

fixCopywriting().catch(console.error);
