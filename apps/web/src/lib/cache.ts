import fs from 'node:fs';
import path from 'node:path';

let cacheData: any = null;
let cacheLoaded = false;

function loadCache() {
  if (cacheLoaded) return;
  
  try {
    const cachePath = path.resolve(process.cwd(), 'src/data/cms-cache.json');
    if (fs.existsSync(cachePath)) {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      cacheData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('❌ [CMS Cache] Failed to read local cache:', err);
  }
  
  cacheLoaded = true;
}

export function getCachedProducts() {
  loadCache();
  return cacheData?.products || null;
}

export function getCachedCategories() {
  loadCache();
  return cacheData?.categories || null;
}

export function getCachedReviews() {
  loadCache();
  return cacheData?.reviews || null;
}

export function getCachedTenant() {
  loadCache();
  return cacheData?.tenant || null;
}

export function hasCache(): boolean {
  loadCache();
  return !!cacheData;
}
