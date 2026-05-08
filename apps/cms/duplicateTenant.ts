// File: apps/cms/duplicateTenant.ts
import dotenv from 'dotenv';
dotenv.config();

import { getPayload } from 'payload';

const SOURCE_TENANT_ID = 6;
const TARGET_TENANT_ID = 7;

/**
 * Pembersihan data: Menghapus field internal Payload agar bisa di-insert sebagai data baru.
 * Menggunakan depth: 0 di find() agar relasi hanya berupa ID (primitive), sehingga aman.
 */
function sanitizeData(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  } else if (data !== null && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Hapus metadata internal
      if (['id', 'tenant', 'createdAt', 'updatedAt', 'sizes'].includes(key)) {
        continue;
      }
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}

async function fetchAll(payload: any, collection: string, where: any) {
  let allDocs: any[] = [];
  let page = 1;
  let hasNextPage = true;
  
  while (hasNextPage) {
    const res = await payload.find({
      collection,
      where,
      limit: 100,
      page,
      depth: 0,
      overrideAccess: true,
    });
    allDocs = allDocs.concat(res.docs);
    hasNextPage = res.hasNextPage;
    page = res.nextPage;
  }
  return allDocs;
}

async function duplicateTenant() {
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });
  console.log(`🚀 Memulai duplikasi data dari Tenant ${SOURCE_TENANT_ID} ke Tenant ${TARGET_TENANT_ID}...`);

  // 0. Pembersihan data lama di target tenant (Idempotency)
  console.log(`🗑️ Membersihkan data lama di Tenant ${TARGET_TENANT_ID}...`);
  const collectionsToClean = ['site-settings', 'gold-price', 'products', 'categories', 'articles', 'testimonials', 'copywriting'] as const;
  for (const coll of collectionsToClean) {
    const existing = await fetchAll(payload, coll, { tenant: { equals: TARGET_TENANT_ID } });
    for (const doc of existing) {
      await payload.delete({
        collection: coll,
        id: doc.id,
        overrideAccess: true,
      });
    }
  }

  const commonOptions = {
    overrideAccess: true,
    depth: 0, // Sangat penting agar relasi tidak berubah jadi object
  };

  // 1. Duplikasi Settings & Harga
  console.log('📦 Menduplikasi Site Settings...');
  const siteSettings = await payload.find({ 
    ...commonOptions,
    collection: 'site-settings', 
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (siteSettings.docs.length > 0) {
    const data = sanitizeData(siteSettings.docs[0]);
    await payload.create({ 
      collection: 'site-settings', 
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  console.log('💰 Menduplikasi Harga Emas...');
  const goldPrice = await payload.find({ 
    ...commonOptions,
    collection: 'gold-price', 
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (goldPrice.docs.length > 0) {
    const data = sanitizeData(goldPrice.docs[0]);
    await payload.create({ 
      collection: 'gold-price', 
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  // 2. Duplikasi Kategori
  console.log('📂 Menduplikasi Kategori...');
  const categoryMap = new Map<number, number>();
  const categories = await fetchAll(payload, 'categories', { tenant: { equals: SOURCE_TENANT_ID } });
  
  for (const cat of categories) {
    const data = sanitizeData(cat);
    const newCat = await payload.create({
      collection: 'categories',
      data: { ...data, slug: `${data.slug}-${TARGET_TENANT_ID}`, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
    categoryMap.set(cat.id, newCat.id);
  }

  // 3. Duplikasi Produk
  console.log('🛒 Menduplikasi Produk...');
  const productMap = new Map<number, number>();
  const products = await fetchAll(payload, 'products', { tenant: { equals: SOURCE_TENANT_ID } });

  for (const prod of products) {
    const data = sanitizeData(prod);
    const oldCatId = typeof prod.category === 'object' ? prod.category.id : prod.category;
    data.category = categoryMap.get(oldCatId) || oldCatId;

    const newProd = await payload.create({
      collection: 'products',
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
    productMap.set(prod.id, newProd.id);
  }

  // 4. Duplikasi Konten
  console.log('📝 Menduplikasi Artikel & Testimoni...');
  const articles = await fetchAll(payload, 'articles', { tenant: { equals: SOURCE_TENANT_ID } });
  for (const art of articles) {
    const data = sanitizeData(art);
    await payload.create({ 
      collection: 'articles', 
      data: { ...data, slug: `${data.slug}-${TARGET_TENANT_ID}`, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  const testimonials = await fetchAll(payload, 'testimonials', { tenant: { equals: SOURCE_TENANT_ID } });
  for (const test of testimonials) {
    const data = sanitizeData(test);
    await payload.create({ 
      collection: 'testimonials', 
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  // 5. Duplikasi Copywriting
  console.log('✍️ Menduplikasi Copywriting (Home Page)...');
  const copywriting = await payload.find({ 
    ...commonOptions,
    collection: 'copywriting', 
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (copywriting.docs.length > 0) {
    const sourceDoc = copywriting.docs[0];
    const data = sanitizeData(sourceDoc);
    
    if (sourceDoc.featuredProducts) {
      data.featuredProducts = sourceDoc.featuredProducts.map((pId: any) => {
        return productMap.get(pId) || pId;
      });
    }
    
    await payload.create({ 
      collection: 'copywriting', 
      data: { ...data, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  console.log(`✅ Selesai! Semua data berhasil diduplikasi ke Tenant ${TARGET_TENANT_ID}.`);
  process.exit(0);
}

duplicateTenant().catch(console.error);
