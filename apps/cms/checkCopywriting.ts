// File: apps/cms/checkCopywriting.ts
import dotenv from 'dotenv';
dotenv.config();

import { getPayload } from 'payload';

async function checkCopywriting() {
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  const copywriting = await payload.find({
    collection: 'copywriting',
    overrideAccess: true,
    depth: 0
  });

  console.log('--- Copywriting Records ---');
  console.log(JSON.stringify(copywriting.docs.map(doc => ({
    id: doc.id,
    tenant: doc.tenant,
    heroTitle: doc.heroTitle
  })), null, 2));
  
  process.exit(0);
}

checkCopywriting().catch(console.error);
