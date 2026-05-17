// File: apps/cms/duplicateTenant.ts
import dotenv from 'dotenv';
import { getPayload } from 'payload';

dotenv.config();

const SOURCE_TENANT_ID = 15;
const TARGET_TENANT_ID = 6;

/**
 * Mempersiapkan data document untuk locale tertentu (my, en, atau id)
 * dengan me-resolve localized fields ke nilai single locale, me-map ID relasi kategori/produk,
 * dan membuang ID internal (root ID, array row IDs, dll) secara rekursif agar
 * Drizzle dan Payload dapat men-generate ID baru yang unik tanpa konflik database constraint.
 */
function prepareDataForLocale({
  doc,
  locale,
  categoryMap,
  productMap,
  fallbackLocale = 'my',
}: {
  doc: any;
  locale: string;
  categoryMap?: Map<number, number>;
  productMap?: Map<number, number>;
  fallbackLocale?: string;
}): any {
  // 1. Resolve localized fields & bersihkan root metadata
  const resolved: any = {};
  for (const [key, value] of Object.entries(doc)) {
    if (['id', 'tenant', 'createdAt', 'updatedAt', 'sizes'].includes(key)) {
      continue;
    }

    // Cek jika field merupakan localized field (object dengan key bahasa)
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0 &&
      Object.keys(value).every((k) => ['en', 'my', 'id'].includes(k))
    ) {
      // Ambil translasi yang sesuai, dengan fallback jika kosong
      resolved[key] = value[locale] || value[fallbackLocale] || value[Object.keys(value)[0]] || null;
    } else {
      resolved[key] = value;
    }
  }

  // 2. Pembersihan ID internal secara rekursif & pemetaan relasi
  function processNode(node: any, parentKey?: string): any {
    if (Array.isArray(node)) {
      return node.map((item) => processNode(item, parentKey));
    } else if (node !== null && typeof node === 'object') {
      // Buka penanganan richText Lexical: Jangan sentuh struktur terdalam agar validasi Lexical tetap valid
      if (parentKey === 'content') {
        return node;
      }

      const copy: any = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === 'id') {
          continue; // Hapus ID agar Drizzle men-generate ID unik baru secara otomatis
        }

        // Pemetaan relasi Kategori di dalam Produk
        if (k === 'category' && categoryMap) {
          const oldCatId = typeof v === 'object' ? (v as any).id : v;
          copy[k] = categoryMap.get(oldCatId) || oldCatId;
          continue;
        }

        // Pemetaan relasi Produk Unggulan di dalam Copywriting
        if (k === 'featuredProducts' && productMap && Array.isArray(v)) {
          copy[k] = v.map((pId) => {
            const oldId = typeof pId === 'object' ? (pId as any).id : pId;
            return productMap.get(oldId) || oldId;
          });
          continue;
        }

        copy[k] = processNode(v, k);
      }
      return copy;
    }
    return node;
  }

  return processNode(resolved);
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
      locale: 'all', // Ambil semua data bahasa
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
  const collectionsToClean = [
    'site-settings',
    'gold-price',
    'products',
    'categories',
    'articles',
    'testimonials',
    'copywriting',
  ] as const;

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
    depth: 0,
    locale: 'all',
  };

  // Helper untuk melakukan Create & Update Multibahasa secara sekuensial dan aman
  async function saveMultilingualDoc({
    collection,
    sourceDoc,
    tenantId,
    categoryMap,
    productMap,
  }: {
    collection: string;
    sourceDoc: any;
    tenantId: number;
    categoryMap?: Map<number, number>;
    productMap?: Map<number, number>;
  }) {
    // 1. Create dengan base locale 'my'
    const myData = prepareDataForLocale({ doc: sourceDoc, locale: 'my', categoryMap, productMap });
    const newDoc = await payload.create({
      collection,
      data: { ...myData, tenant: tenantId },
      overrideAccess: true,
      locale: 'my',
    });

    // 2. Update dengan locale 'en'
    const enData = prepareDataForLocale({ doc: sourceDoc, locale: 'en', categoryMap, productMap });
    await payload.update({
      collection,
      id: newDoc.id,
      data: enData,
      overrideAccess: true,
      locale: 'en',
    });

    // 3. Update dengan locale 'id' (menggunakan fallback my jika kosong)
    const idData = prepareDataForLocale({ doc: sourceDoc, locale: 'id', categoryMap, productMap });
    await payload.update({
      collection,
      id: newDoc.id,
      data: idData,
      overrideAccess: true,
      locale: 'id',
    });

    return newDoc;
  }

  // 1. Duplikasi Settings & Harga
  console.log('📦 Menduplikasi Site Settings...');
  const siteSettings = await payload.find({
    ...commonOptions,
    collection: 'site-settings',
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (siteSettings.docs.length > 0) {
    await saveMultilingualDoc({
      collection: 'site-settings',
      sourceDoc: siteSettings.docs[0],
      tenantId: TARGET_TENANT_ID,
    });
  }

  console.log('💰 Menduplikasi Harga Emas...');
  const goldPrice = await payload.find({
    ...commonOptions,
    collection: 'gold-price',
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (goldPrice.docs.length > 0) {
    await saveMultilingualDoc({
      collection: 'gold-price',
      sourceDoc: goldPrice.docs[0],
      tenantId: TARGET_TENANT_ID,
    });
  }

  // 2. Duplikasi Kategori
  console.log('📂 Menduplikasi Kategori...');
  const categoryMap = new Map<number, number>();
  const categories = await fetchAll(payload, 'categories', { tenant: { equals: SOURCE_TENANT_ID } });

  for (const cat of categories) {
    const newCat = await saveMultilingualDoc({
      collection: 'categories',
      sourceDoc: cat,
      tenantId: TARGET_TENANT_ID,
    });
    categoryMap.set(cat.id, newCat.id);
  }

  // 3. Duplikasi Produk
  console.log('🛒 Menduplikasi Produk...');
  const productMap = new Map<number, number>();
  const products = await fetchAll(payload, 'products', { tenant: { equals: SOURCE_TENANT_ID } });

  for (const prod of products) {
    const newProd = await saveMultilingualDoc({
      collection: 'products',
      sourceDoc: prod,
      tenantId: TARGET_TENANT_ID,
      categoryMap,
    });
    productMap.set(prod.id, newProd.id);
  }

  // 4. Duplikasi Konten
  console.log('📝 Menduplikasi Artikel & Testimoni...');
  const articles = await fetchAll(payload, 'articles', { tenant: { equals: SOURCE_TENANT_ID } });
  for (const art of articles) {
    await saveMultilingualDoc({
      collection: 'articles',
      sourceDoc: art,
      tenantId: TARGET_TENANT_ID,
    });
  }

  const testimonials = await fetchAll(payload, 'testimonials', { tenant: { equals: SOURCE_TENANT_ID } });
  for (const test of testimonials) {
    await saveMultilingualDoc({
      collection: 'testimonials',
      sourceDoc: test,
      tenantId: TARGET_TENANT_ID,
    });
  }

  // 5. Duplikasi Copywriting (Home Page)
  console.log('✍️ Menduplikasi Copywriting (Home Page)...');
  const copywriting = await payload.find({
    ...commonOptions,
    collection: 'copywriting',
    where: { tenant: { equals: SOURCE_TENANT_ID } },
  });
  if (copywriting.docs.length > 0) {
    await saveMultilingualDoc({
      collection: 'copywriting',
      sourceDoc: copywriting.docs[0],
      tenantId: TARGET_TENANT_ID,
      productMap,
    });
  }

  console.log(`\n✅ Selesai! Semua data berhasil diduplikasi ke Tenant ${TARGET_TENANT_ID} secara sempurna tanpa ada database loss.`);
  process.exit(0);
}

duplicateTenant().catch(console.error);
