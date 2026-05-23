import fs from 'node:fs';
import path from 'node:path';
import { resolveTenant } from './cms';

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

export async function getTenantForBuild() {
  if (hasCache()) {
    const cached = getCachedTenant();
    if (cached) return cached;
  }
  const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  try {
    const url = new URL(SITE_URL);
    const hostname = url.hostname + (url.port ? `:${url.port}` : '');
    return await resolveTenant(hostname);
  } catch (err) {
    console.error('❌ [getTenantForBuild] Error:', err);
    return null;
  }
}

