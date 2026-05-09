import dotenv from 'dotenv';
dotenv.config();
import { getPayload } from 'payload';

async function check() {
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: 8,
    });
    console.log('✅ Tenant 8 exists:', tenant.name);
  } catch (e: any) {
    console.log('❌ Tenant 8 does not exist or error:', e.message);
    return;
  }
  
  const collections = ['site-settings', 'gold-price', 'products', 'categories', 'articles', 'testimonials', 'copywriting'] as const;
  for (const coll of collections) {
    const res = await payload.find({
      collection: coll,
      where: { tenant: { equals: 8 } },
      limit: 1,
    });
    if (res.totalDocs > 0) {
      console.log(`⚠️ Tenant 8 ALREADY HAS DATA in collection: ${coll} (${res.totalDocs} docs)`);
    }
  }
}

check().catch(console.error);
