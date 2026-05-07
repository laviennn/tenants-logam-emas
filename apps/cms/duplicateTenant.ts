// File: apps/cms/duplicateTenant.ts
import dotenv from 'dotenv';
dotenv.config();

import { getPayload } from 'payload';

const SOURCE_TENANT_ID = 2;
const TARGET_TENANT_ID = 4;

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

async function duplicateTenant() {
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });
  console.log(`🚀 Memulai duplikasi data dari Tenant ${SOURCE_TENANT_ID} ke Tenant ${TARGET_TENANT_ID}...`);

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
  const categories = await payload.find({ 
    ...commonOptions,
    collection: 'categories', 
    where: { tenant: { equals: SOURCE_TENANT_ID } }, 
    limit: 100,
  });
  
  for (const cat of categories.docs) {
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
  const products = await payload.find({ 
    ...commonOptions,
    collection: 'products', 
    where: { tenant: { equals: SOURCE_TENANT_ID } }, 
    limit: 500,
  });

  for (const prod of products.docs) {
    const data = sanitizeData(prod);
    const oldCatId = prod.category;
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
  const articles = await payload.find({ 
    ...commonOptions,
    collection: 'articles', 
    where: { tenant: { equals: SOURCE_TENANT_ID } }, 
    limit: 100,
  });
  for (const art of articles.docs) {
    const data = sanitizeData(art);
    await payload.create({ 
      collection: 'articles', 
      data: { ...data, slug: `${data.slug}-${TARGET_TENANT_ID}`, tenant: TARGET_TENANT_ID },
      overrideAccess: true
    });
  }

  const testimonials = await payload.find({ 
    ...commonOptions,
    collection: 'testimonials', 
    where: { tenant: { equals: SOURCE_TENANT_ID } }, 
    limit: 100,
  });
  for (const test of testimonials.docs) {
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

  console.log('✅ Selesai! Semua data berhasil diduplikasi ke Tenant 4.');
  process.exit(0);
}

duplicateTenant().catch(console.error);
