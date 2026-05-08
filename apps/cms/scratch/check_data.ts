import dotenv from 'dotenv';
dotenv.config({ path: '/Users/naoo/P.A.R.A/PROJECTS/dev-logam_tenants/apps/cms/.env' });
import { getPayload } from 'payload';

async function check() {
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  
  const allSiteSettings = await payload.find({
    collection: 'site-settings',
    limit: 100,
  });
  console.log('All Site Settings:', allSiteSettings.docs.map(d => ({ id: d.id, brandName: (d as any).brandName, tenant: typeof (d as any).tenant === 'object' ? (d as any).tenant?.id : (d as any).tenant })));
  
  const goldPrice = await payload.find({
    collection: 'gold-price',
    where: { tenant: { equals: 5 } },
  });
  console.log('Tenant 5 Gold Price:', goldPrice.docs.map(d => ({ id: d.id, title: (d as any).title })));
  
  const siteSettings6 = await payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: 6 } },
  });
  console.log('Tenant 6 Site Settings:', siteSettings6.docs.map(d => ({ id: d.id, brandName: (d as any).brandName })));
}

check().catch(console.error);
