import dotenv from 'dotenv';
dotenv.config({ path: '/Users/naoo/P.A.R.A/PROJECTS/dev-logam_tenants/apps/cms/.env' });
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

async function restore() {
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  const SOURCE_TENANT_ID = 4;
  const TARGET_TENANT_ID = 6;
  
  console.log(`🚀 Memulai pemulihan data dari Tenant ${SOURCE_TENANT_ID} ke Tenant ${TARGET_TENANT_ID}...`);
  
  // 1. Site Settings
  const siteSettings = await payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: SOURCE_TENANT_ID } },
    depth: 0,
  });
  
  if (siteSettings.docs.length > 0) {
    const data = sanitizeData(siteSettings.docs[0]);
    await payload.create({
      collection: 'site-settings',
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true,
    });
    console.log('✅ Site Settings berhasil dipulihkan.');
  } else {
    console.log('⚠️ Tidak ada Site Settings di Tenant 4.');
  }
  
  // 2. Gold Price
  const goldPrice = await payload.find({
    collection: 'gold-price',
    where: { tenant: { equals: SOURCE_TENANT_ID } },
    depth: 0,
  });
  
  if (goldPrice.docs.length > 0) {
    const data = sanitizeData(goldPrice.docs[0]);
    await payload.create({
      collection: 'gold-price',
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true,
    });
    console.log('✅ Gold Price berhasil dipulihkan.');
  } else {
    console.log('⚠️ Tidak ada Gold Price di Tenant 4.');
  }
  
  console.log('🎉 Selesai!');
  process.exit(0);
}

restore().catch(console.error);
