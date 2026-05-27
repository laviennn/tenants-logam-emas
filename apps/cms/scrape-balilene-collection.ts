import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { getPayload } from 'payload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const TARGET_TENANT_ID = 12; // Lux Brand Store
const TARGET_URL = process.argv[2] || 'https://balilene.com/collections/tas-coach/products.json?limit=50';
const TEMP_DIR = path.resolve(__dirname, 'temp-images-balilene');

// Helper to download image
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Image Download] Failed to fetch image: ${url} (Status: ${res.status})`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.promises.writeFile(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`[Image Download] Error downloading image from ${url}:`, err);
    return false;
  }
}

// Helper to clean HTML to plain text with newlines
function cleanDescription(html: string): string {
  if (!html) return '';
  const $ = cheerio.load(html);

  // Replace br tags with newlines
  $('br').replaceWith('\n');

  // Append newlines to block elements
  $('p, div, li, h1, h2, h3, h4, h5, h6, tr, ul, ol').each(function () {
    $(this).append('\n');
  });

  let text = $.text();
  text = text.replace(/\r/g, '\n');

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.join('\n\n');
}

// Helper to derive Category name candidates
function getCategoryCandidates(productName: string): string[] {
  const words = productName.trim().split(/\s+/);
  if (words.length >= 2) {
    const firstTwo = `${words[0]} ${words[1]}`.toLowerCase();
    if (firstTwo === 'tory burch' || firstTwo === 'torry burch' || firstTwo === 'torry buch' || firstTwo === 'tory buch') {
      return ['Torry Buch', 'Torry Burch', 'Tory Burch', 'Tory Buch', 'Tory'];
    }
    if (firstTwo === 'michael kors') {
      return ['Michael Kors', 'Michael'];
    }
    if (firstTwo === 'kate spade') {
      return ['Kate Spade', 'Kate'];
    }
    if (firstTwo === 'marc jacobs') {
      return ['Marc Jacobs', 'Marc'];
    }
  }

  const firstWord = words[0] || 'Branded';
  const capitalized = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  return [capitalized];
}

// Discount tier logic based on nearest tier
function getDiscountPercent(price: number): number {
  const tiers = [
    { target: 1_000_000, discount: 50 },
    { target: 1_500_000, discount: 40 },
    { target: 2_000_000, discount: 35 },
    { target: 3_000_000, discount: 32 },
    { target: 4_000_000, discount: 30 },
    { target: 5_000_000, discount: 25 },
    { target: 6_000_000, discount: 24 },
    { target: 7_000_000, discount: 22 },
    { target: 8_000_000, discount: 20 },
    { target: 9_000_000, discount: 15 },
    { target: 10_000_000, discount: 15 },
  ];

  let closestTier = tiers[0];
  let minDiff = Math.abs(price - closestTier.target);

  for (const tier of tiers) {
    const diff = Math.abs(price - tier.target);
    if (diff < minDiff) {
      minDiff = diff;
      closestTier = tier;
    }
  }

  return closestTier.discount;
}

async function scrapeAndSeed() {
  console.log('🚀 Initializing Payload CMS programmatic instance...');
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // To support both direct .json and HTML list parsing, let's parse the HTML list to get handles,
  // then fetch details via JSON. This ensures we get the EXACT order from the HTML page (e.g. best-selling).
  let productHandles: string[] = [];
  
  const isHtml = !TARGET_URL.endsWith('.json');
  if (isHtml) {
    let currentPage = 1;
    while (productHandles.length < 50) {
      let url = TARGET_URL;
      if (url.includes('page=')) {
        url = url.replace(/page=\d+/, `page=${currentPage}`);
      } else {
        url = url.includes('?') ? `${url}&page=${currentPage}` : `${url}?page=${currentPage}`;
      }

      console.log(`🌐 Fetching Balilene HTML collection page: ${url}`);
      try {
        const homeRes = await fetch(url);
        const homeHtml = await homeRes.text();
        const $ = cheerio.load(homeHtml);

        let foundOnPage = 0;
        // Find product items specifically inside the main collection product grid
        let items = $('#main-collection-product-grid .product-item');
        if (items.length === 0) {
          // General fallback but exclude recommendation/related products sections
          items = $('.product-item').filter((_, el) => {
            const insideRecommendation = $(el).closest('[class*="recommend"], [class*="related"], [class*="recent"], [id*="recommend"], [id*="related"], [id*="recent"]').length > 0;
            return !insideRecommendation;
          });
        }

        items.each((_, el) => {
          const handle = $(el).attr('data-product-handle');
          if (handle && !productHandles.includes(handle)) {
            productHandles.push(handle);
            foundOnPage++;
          }
        });

        // Fallback if the data attribute is slightly different
        if (foundOnPage === 0) {
          let compareItems = $('#main-collection-product-grid .card-product__group-item.card-compare');
          if (compareItems.length === 0) {
            compareItems = $('.card-product__group-item.card-compare').filter((_, el) => {
              const insideRecommendation = $(el).closest('[class*="recommend"], [class*="related"], [class*="recent"], [id*="recommend"], [id*="related"], [id*="recent"]').length > 0;
              return !insideRecommendation;
            });
          }

          compareItems.each((_, el) => {
            const handle = $(el).attr('data-product-compare-handle');
            if (handle && !productHandles.includes(handle)) {
              productHandles.push(handle);
              foundOnPage++;
            }
          });
        }

        if (foundOnPage === 0) {
          console.log(`🔍 No more product handles found on page ${currentPage}. Stopping pagination.`);
          break;
        }

        console.log(`🔍 Found ${foundOnPage} handles on page ${currentPage}. Total so far: ${productHandles.length}`);
        currentPage++;
      } catch (err) {
        console.error(`❌ Error fetching page ${currentPage}:`, err);
        break;
      }
    }

    // Limit to 50
    productHandles = productHandles.slice(0, 50);
    console.log(`🔍 Total unique product handles to process: ${productHandles.length}`);
  } else {
    // Legacy direct json URL fallback
    console.log(`🌐 Fetching Balilene JSON collection: ${TARGET_URL}`);
    const res = await fetch(TARGET_URL);
    const data = await res.json();
    if (data.products) {
      productHandles = data.products.map((p: any) => p.handle).slice(0, 50);
    }
  }

  if (productHandles.length === 0) {
    console.log('❌ No products found to process. Exiting.');
    process.exit(1);
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < productHandles.length; i++) {
    const handle = productHandles[i];
    console.log(`\n----------------------------------------`);
    console.log(`[${i + 1}/${productHandles.length}] Fetching product detail: "${handle}"`);
    
    // Fetch JSON detail for this product
    const detailUrl = `https://balilene.com/products/${handle}.json`;
    let detailData: any = null;
    try {
      const detailRes = await fetch(detailUrl);
      const detailJson = await detailRes.json();
      detailData = detailJson.product;
    } catch (e) {
      console.error(`   ❌ Failed to fetch JSON for ${handle}: `, e);
      continue;
    }
    
    if (!detailData) {
       console.error(`   ❌ Product data not found in JSON response for ${handle}.`);
       continue;
    }
    
    const name = detailData.title;
    if (!name) continue;

    // 1. Minimum Price Check
    // Get the first variant's price
    let priceStr = detailData.variants?.[0]?.price;
    if (!priceStr && detailData.price) priceStr = detailData.price;
    const priceValue = parseFloat(priceStr || '0');
    
    if (priceValue < 1_000_000) {
      console.log(`   ⚠️ Skipping product: "${name}" because price (Rp ${priceValue}) is less than Rp 1,000,000.`);
      continue;
    }
    
    // 2. Discount Logic
    const discountPercentValue = getDiscountPercent(priceValue);
    const spreadPriceValue = 0; // No spread, as requested
    
    console.log(`   Pricing Output -> price: Rp ${priceValue}, discountPercent: ${discountPercentValue}%, spreadPrice: ${spreadPriceValue}`);

    // 3. Idempotency Check
    const existingProducts = await payload.find({
      collection: 'products',
      where: {
        and: [
          { name: { equals: name } },
          { tenant: { equals: TARGET_TENANT_ID } }
        ]
      },
      overrideAccess: true,
      depth: 0,
    });

    const isExisting = existingProducts.docs.length > 0;
    const existingProduct = isExisting ? existingProducts.docs[0] : null;

    // 4. Extract Description & Colors
    const description = cleanDescription(detailData.body_html || '');
    console.log(`   Extracted Description length: ${description.length} characters.`);

    const colors: { name: string }[] = [];
    if (detailData.options && detailData.options.length > 0) {
       // Just take values from the first option usually Color or Title
       const optionValues = detailData.options[0].values || [];
       for (const val of optionValues) {
           if (val && val.toLowerCase() !== 'default title') {
               colors.push({ name: val });
           }
       }
    }

    // Extract Gallery Image URLs
    const galleryUrls = (detailData.images || []).map((img: any) => img.src);
    console.log(`   Extracted ${galleryUrls.length} unique image URLs.`);

    if (galleryUrls.length === 0) {
      console.warn(`   ⚠️ No images found for product "${name}". Skipping.`);
      continue;
    }

    // 5. Download and upload images (only if product is new)
    let mainImageId: any = '';
    let galleryImageIds: any[] = [];

    if (!isExisting) {
      const uploadedMediaIds: any[] = [];
      for (let j = 0; j < galleryUrls.length; j++) {
        let imgUrl = galleryUrls[j];
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
        
        const filename = imgUrl.split('/').pop()?.split('?')[0] || `image-${Date.now()}-${j}.jpg`;
        const tempPath = path.resolve(TEMP_DIR, filename);

        console.log(`   📥 Downloading [${j + 1}/${galleryUrls.length}] image: ${imgUrl}`);
        const success = await downloadImage(imgUrl, tempPath);
        if (!success) continue;

        // Upload to Payload CMS
        console.log(`   📤 Uploading media: ${filename}`);
        try {
          const media = await payload.create({
            collection: 'media',
            data: {
              alt: `${name} Image ${j + 1}`,
              tenant: TARGET_TENANT_ID,
            },
            filePath: tempPath,
            overrideAccess: true,
          });
          uploadedMediaIds.push(media.id);
        } catch (uploadErr) {
          console.error(`   ❌ Failed to upload image ${filename} to Payload CMS:`, uploadErr);
        } finally {
          // Clean up temp file
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      }

      if (uploadedMediaIds.length === 0) {
        console.warn(`   ⚠️ No media was successfully uploaded for "${name}". Skipping product creation.`);
        continue;
      }

      mainImageId = uploadedMediaIds[0];
      galleryImageIds = uploadedMediaIds.slice(1).map(id => ({ image: id }));
    }

    // 6. Category resolution / creation
    const catCandidates = getCategoryCandidates(name);
    console.log(`   📁 Resolving Category candidates:`, catCandidates);
    let categoryId: any = undefined;

    // Check in all locales and all candidate names
    outerLoop:
    for (const loc of ['my', 'id', 'en'] as const) {
      for (const candidate of catCandidates) {
        const existingCats = await payload.find({
          collection: 'categories',
          where: {
            and: [
              { name: { equals: candidate } },
              { tenant: { equals: TARGET_TENANT_ID } }
            ]
          },
          locale: loc,
          overrideAccess: true,
          depth: 0,
        });

        if (existingCats.docs.length > 0) {
          categoryId = existingCats.docs[0].id;
          console.log(`   ✅ Category exists (matched "${candidate}" in locale "${loc}"): ID ${categoryId}`);
          break outerLoop;
        }
      }
    }

    if (categoryId) {
      // Ensure name is updated/populated in all locales
      const resolvedName = catCandidates[0]; 
      for (const loc of ['id', 'en', 'my'] as const) {
        await payload.update({
          collection: 'categories',
          id: categoryId,
          data: { name: resolvedName },
          locale: loc,
          overrideAccess: true,
        });
      }
    } else {
      const primaryCatName = catCandidates[0];
      console.log(`   ➕ Creating new Category: "${primaryCatName}"`);
      const newCat = await payload.create({
        collection: 'categories',
        data: { name: primaryCatName, tenant: TARGET_TENANT_ID },
        locale: 'id',
        overrideAccess: true,
      });
      categoryId = newCat.id;

      // Update for en and my
      await payload.update({
        collection: 'categories',
        id: categoryId,
        data: { name: primaryCatName },
        locale: 'en',
        overrideAccess: true,
      });
      await payload.update({
        collection: 'categories',
        id: categoryId,
        data: { name: primaryCatName },
        locale: 'my',
        overrideAccess: true,
      });
      console.log(`   ✅ Category created: ID ${categoryId}`);
    }

    // 7. Create or Update Product
    if (isExisting && existingProduct) {
      await payload.update({
        collection: 'products',
        id: existingProduct.id,
        data: {
          name: name,
          description: description,
          price: priceValue,
          discountPercent: discountPercentValue,
          spreadPrice: spreadPriceValue,
          colors: colors,
          category: categoryId,
        },
        locale: 'id',
        overrideAccess: true,
      });

      await payload.update({
        collection: 'products',
        id: existingProduct.id,
        data: {
          name: name,
          description: description,
        },
        locale: 'en',
        overrideAccess: true,
      });

      await payload.update({
        collection: 'products',
        id: existingProduct.id,
        data: {
          name: name,
          description: description,
        },
        locale: 'my',
        overrideAccess: true,
      });

      console.log(`   ✅ Product updated successfully: ID ${existingProduct.id}`);
      importedCount++;
    } else {
      console.log(`   ➕ Creating Product document in Payload...`);
      const newProduct = await payload.create({
        collection: 'products',
        data: {
          name: name,
          description: description,
          price: priceValue,
          discountPercent: discountPercentValue,
          spreadPrice: spreadPriceValue,
          stock: 10,
          showOnHomepage: true,
          isFeatured: false,
          tenant: TARGET_TENANT_ID,
          category: categoryId,
          image: mainImageId,
          gallery: galleryImageIds,
          colors: colors,
        },
        locale: 'id',
        overrideAccess: true,
      });

      await payload.update({
        collection: 'products',
        id: newProduct.id,
        data: {
          name: name,
          description: description,
        },
        locale: 'en',
        overrideAccess: true,
      });

      await payload.update({
        collection: 'products',
        id: newProduct.id,
        data: {
          name: name,
          description: description,
        },
        locale: 'my',
        overrideAccess: true,
      });

      console.log(`   ✅ Product created successfully: ID ${newProduct.id}`);
      importedCount++;
    }
  }

  // Final clean up
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmdirSync(TEMP_DIR);
  }

  console.log(`\n========================================`);
  console.log(`🏁 Scraping and seeding complete!`);
  console.log(`   Imported products: ${importedCount}`);
  console.log(`   Skipped (already exists): ${skippedCount}`);
  console.log(`========================================`);

  process.exit(0);
}

scrapeAndSeed().catch(err => {
  console.error('Fatal Scraper Error:', err);
  process.exit(1);
});
