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

async function run() {
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  const SOURCE_TENANT_ID = 6;
  const TARGET_TENANTS = [7, 8];
  const collections = ['site-settings', 'gold-price'] as const;
  
  console.log(`🚀 Memulai pemulihan Site Settings & Gold Price dari Tenant ${SOURCE_TENANT_ID} ke Tenant ${TARGET_TENANTS.join(', ')}...`);
  
  for (const targetId of TARGET_TENANTS) {
    console.log(`\nProcessing Target Tenant: ${targetId}`);
    
    for (const coll of collections) {
      // 1. Clean up existing data in target
      const existing = await payload.find({
        collection: coll,
        where: { tenant: { equals: targetId } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      });
      
      for (const doc of existing.docs) {
        console.log(`🗑️ Deleting existing doc in ${coll} for tenant ${targetId}`);
        await payload.delete({
          collection: coll,
          id: doc.id,
          overrideAccess: true,
        });
      }
      
      // 2. Fetch from source
      const sourceDocs = await payload.find({
        collection: coll,
        where: { tenant: { equals: SOURCE_TENANT_ID } },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      });
      
      console.log(`📦 Found ${sourceDocs.docs.length} docs in ${coll} for source tenant ${SOURCE_TENANT_ID}`);
      
      // 3. Insert into target
      for (const doc of sourceDocs.docs) {
        const sanitized = sanitizeData(doc);
        sanitized.tenant = targetId; // Set target tenant ID
        
        console.log(`➕ Inserting doc into ${coll} for tenant ${targetId}`);
        await payload.create({
          collection: coll,
          data: sanitized,
          overrideAccess: true,
        });
      }
    }
  }
  
  console.log('\n✅ Selesai! Data Site Settings & Gold Price telah dipulihkan.');
}

run().catch(console.error);
