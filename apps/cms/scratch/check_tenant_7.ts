import dotenv from 'dotenv';
dotenv.config();
import { getPayload } from 'payload';

async function check() {
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  const collections = ['site-settings', 'gold-price', 'products', 'categories', 'articles', 'testimonials', 'copywriting'] as const;
  console.log('📊 Checking Tenant 7 data status:');
  for (const coll of collections) {
    const res = await payload.find({
      collection: coll,
      where: { tenant: { equals: 7 } },
      limit: 1,
    });
    console.log(`- ${coll}: ${res.totalDocs} docs`);
  }
}

check().catch(console.error);
