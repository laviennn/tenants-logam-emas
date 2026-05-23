import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const CMS_URL = process.env.PUBLIC_CMS_URL || 'http://localhost:3000';
// Cloudflare sometimes uses CF_PAGES_URL, but we rely on PUBLIC_SITE_URL for tenant matching
let SITE_URL = process.env.PUBLIC_SITE_URL;

if (!SITE_URL) {
  console.log('⚡ [CMS Cache] PUBLIC_SITE_URL not set. Skipping prebuild cache.');
  process.exit(0);
}

const hostname = new URL(SITE_URL).hostname.toLowerCase();

async function run() {
  console.log(`⚡ [CMS Cache] Resolving tenant for: ${hostname}`);
  
  try {
    const res = await fetch(
      `${CMS_URL}/api/tenants?where[domains.domain][equals]=${encodeURIComponent(hostname)}&limit=1&depth=1`
    );
    
    if (!res.ok) {
      console.log(`⚡ [CMS Cache] Tenant lookup failed (${res.status}). Skipping.`);
      process.exit(0);
    }
    
    const json = await res.json();
    const tenant = json.docs?.[0] ?? null;
    
    if (!tenant) {
      console.log('⚡ [CMS Cache] Tenant not found. Skipping.');
      process.exit(0);
    }
    
    if (tenant.theme_layout !== 'luxury-branded') {
      console.log(`⚡ [CMS Cache] Tenant ${tenant.name} uses '${tenant.theme_layout}' theme. Skipping cache (only for luxury-branded).`);
      process.exit(0);
    }
    
    console.log(`⚡ [CMS Cache] Tenant ${tenant.name} is luxury-branded. Building JSON cache...`);
    const tenantId = tenant.id;
    const tenantFilter = `&where[tenant][equals]=${tenantId}`;
    
    // Fetch all needed resources in bulk
    const [productsRes, categoriesRes, reviewsRes] = await Promise.all([
      fetch(`${CMS_URL}/api/products?limit=1000${tenantFilter}`),
      fetch(`${CMS_URL}/api/categories?limit=100${tenantFilter}`),
      fetch(`${CMS_URL}/api/reviews?limit=10000${tenantFilter}`)
    ]);
    
    const productsData = await productsRes.json();
    const categoriesData = await categoriesRes.json();
    const reviewsData = await reviewsRes.json();
    
    const cacheData = {
      tenant,
      products: productsData.docs || [],
      categories: categoriesData.docs || [],
      reviews: reviewsData.docs || []
    };
    
    const cacheDir = path.resolve(process.cwd(), 'src/data');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const cacheFile = path.join(cacheDir, 'cms-cache.json');
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    
    console.log(`✅ [CMS Cache] Successfully cached ${cacheData.products.length} products, ${cacheData.categories.length} categories, and ${cacheData.reviews.length} reviews.`);
    
  } catch (error) {
    console.error('❌ [CMS Cache] Error during caching:', error);
    process.exit(0); // Exit gracefully so the build doesn't crash on network errors
  }
}

run();
