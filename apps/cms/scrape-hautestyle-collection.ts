// File: apps/cms/scrape-hautestyle-collection.ts
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { getPayload } from 'payload';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const TARGET_TENANT_ID = 10; // sejahtera.id
const BASE_URL = 'https://www.hautestyle.com.my';
const DEFAULT_TARGET_URL = 'https://www.hautestyle.com.my/collections/kate-spade';
const TARGET_URL = process.argv[2] || DEFAULT_TARGET_URL;
const TEMP_DIR = path.resolve(__dirname, 'temp-images-hautestyle');

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

async function scrapeAndSeed() {
  console.log('🚀 Initializing Payload CMS programmatic instance...');
  const { default: configPromise } = await import('./src/payload.config');
  const payload = await getPayload({ config: configPromise });

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Parse collection handle from Target URL
  const urlObj = new URL(TARGET_URL);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const collectionIndex = pathParts.indexOf('collections');
  const collectionHandle = collectionIndex !== -1 && pathParts[collectionIndex + 1]
    ? pathParts[collectionIndex + 1]
    : 'kate-spade';

  console.log(`🌐 Scraping Hautestyle collection: "${collectionHandle}" (Target URL: ${TARGET_URL})`);

  let page = 1;
  let hasMore = true;
  let importedCount = 0;
  let skippedCount = 0;

  while (hasMore) {
    const collectionJsonUrl = `${BASE_URL}/collections/${collectionHandle}/products.json?limit=250&page=${page}`;
    console.log(`\n========================================`);
    console.log(`🌐 Fetching page ${page} from: ${collectionJsonUrl}`);
    console.log(`========================================`);

    let collectionRes;
    try {
      collectionRes = await fetch(collectionJsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    } catch (fetchErr) {
      console.error(`❌ Failed to fetch collection page ${page}:`, fetchErr);
      break;
    }

    if (!collectionRes.ok) {
      console.error(`❌ Collection API returned status ${collectionRes.status}`);
      break;
    }

    const collectionData = await collectionRes.json() as any;
    const products = collectionData.products || [];
    console.log(`🔍 Found ${products.length} products on Page ${page}.`);

    if (products.length === 0) {
      console.log(`ℹ️ No more products returned. Ending pagination loop.`);
      hasMore = false;
      break;
    }

    for (let i = 0; i < products.length; i++) {
      if (importedCount >= 50) {
        console.log(`\n🏁 Reached limit of 50 successfully imported products. Stopping scrape loop.`);
        hasMore = false;
        break;
      }
      const productItem = products[i];
      const name = productItem.title?.trim();
      if (!name) continue;
      const handle = productItem.handle;
      const lowerName = name.toLowerCase();

      // 1. Idempotency Check
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

      // Filter Longchamp
      if (lowerName.includes('longchamp')) {
        console.log(`\n----------------------------------------`);
        console.log(`[Page ${page} - Product ${i + 1}/${products.length}] Skipping product: "${name}" (Longchamp is ignored)`);
        if (isExisting && existingProduct) {
          console.log(`   🗑️ Deleting existing Longchamp product: "${name}" (ID: ${existingProduct.id}) from DB...`);
          await payload.delete({
            collection: 'products',
            id: existingProduct.id,
            overrideAccess: true,
          });
        }
        continue;
      }

      const isTargetBrand =
        lowerName.startsWith('michael kors') ||
        lowerName.startsWith('tory burch') ||
        lowerName.startsWith('torry burch') ||
        lowerName.startsWith('torry buch') ||
        lowerName.startsWith('tory buch') ||
        lowerName.startsWith('coach') ||
        lowerName.startsWith('kate spade');

      if (!isTargetBrand) {
        console.log(`\n----------------------------------------`);
        console.log(`[Page ${page} - Product ${i + 1}/${products.length}] Skipping product: "${name}" (not in target brand list)`);
        if (isExisting && existingProduct) {
          console.log(`   🗑️ Deleting existing non-target brand product: "${name}" (ID: ${existingProduct.id}) from DB...`);
          await payload.delete({
            collection: 'products',
            id: existingProduct.id,
            overrideAccess: true,
          });
        }
        continue;
      }

      // 2. Fetch detail JSON
      const detailJsonUrl = `${BASE_URL}/products/${handle}.json`;
      console.log(`\n----------------------------------------`);
      console.log(`[Page ${page} - Product ${i + 1}/${products.length}] Processing product: "${name}"`);
      console.log(`   🔗 Fetching product detail JSON: ${detailJsonUrl}`);

      let detailRes;
      try {
        detailRes = await fetch(detailJsonUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
      } catch (err) {
        console.error(`   ❌ Failed to fetch detail JSON:`, err);
        continue;
      }

      if (!detailRes.ok) {
        console.warn(`   ⚠️ Detail JSON returned status ${detailRes.status}. Skipping.`);
        continue;
      }

      const detailData = await detailRes.json() as any;
      const product = detailData.product;
      if (!product) {
        console.warn(`   ⚠️ No product object in detail response. Skipping.`);
        continue;
      }

      // 3. Extract details (Prices)
      const primaryVariant = product.variants?.[0];
      if (!primaryVariant) {
        console.warn(`   ⚠️ No variants found for product "${name}". Skipping.`);
        continue;
      }

      const salePrice = parseFloat(primaryVariant.price || '0');
      const origPrice = primaryVariant.compare_at_price
        ? parseFloat(primaryVariant.compare_at_price)
        : salePrice;

      console.log(`   Scraped Prices -> Sale Price: RM ${salePrice}, Original Price: RM ${origPrice}`);

      if (salePrice < 650) {
        console.log(`   ⚠️ Skipping product: "${name}" because price (RM ${salePrice}) is less than RM 500.`);
        if (isExisting && existingProduct) {
          console.log(`   🗑️ Deleting existing product < RM 500: "${name}" (ID: ${existingProduct.id}) from DB...`);
          await payload.delete({
            collection: 'products',
            id: existingProduct.id,
            overrideAccess: true,
          });
        }
        continue;
      }

      // Extract Description
      const descHtml = product.body_html || '';
      const description = cleanDescription(descHtml);
      console.log(`   Extracted Description length: ${description.length} characters.`);

      // Extract Variant Colors (checking Options for 'Color' or 'Colour')
      const colors: { name: string }[] = [];
      const colorOption = product.options?.find(
        (opt: any) => opt.name?.toLowerCase() === 'color' || opt.name?.toLowerCase() === 'colour'
      );

      if (colorOption && Array.isArray(colorOption.values)) {
        colorOption.values.forEach((colorName: string) => {
          const trimmedColor = colorName.trim();
          if (trimmedColor && trimmedColor.toLowerCase() !== 'default title' && !colors.some(c => c.name === trimmedColor)) {
            colors.push({ name: trimmedColor });
          }
        });
      }
      console.log(`   Extracted Colors:`, colors.map(c => c.name));

      // Extract Gallery Image URLs (excluding duplicates)
      const galleryUrlsSet = new Set<string>();
      if (Array.isArray(product.images)) {
        product.images.forEach((img: any) => {
          if (img.src) {
            let srcUrl = img.src;
            if (srcUrl.startsWith('//')) {
              srcUrl = 'https:' + srcUrl;
            }
            galleryUrlsSet.add(srcUrl);
          }
        });
      }

      const galleryUrls = Array.from(galleryUrlsSet);
      console.log(`   Extracted ${galleryUrls.length} unique image URLs.`);

      if (galleryUrls.length === 0) {
        console.warn(`   ⚠️ No images found for product "${name}". Skipping.`);
        continue;
      }

      // 4. Download and upload images (only if product is new)
      let mainImageId = '';
      let galleryImageIds: { image: string }[] = [];

      if (!isExisting) {
        const uploadedMediaIds: string[] = [];
        for (let j = 0; j < galleryUrls.length; j++) {
          const imgUrl = galleryUrls[j];
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
            uploadedMediaIds.push(media.id as string);
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

      // 5. Category resolution / creation
      const catCandidates = getCategoryCandidates(name);
      console.log(`   📁 Resolving Category candidates:`, catCandidates);
      let categoryId = '';

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
            categoryId = existingCats.docs[0].id as string;
            console.log(`   ✅ Category exists (matched "${candidate}" in locale "${loc}"): ID ${categoryId}`);
            break outerLoop;
          }
        }
      }

      if (categoryId) {
        // Ensure name is updated/populated in all locales
        const resolvedName = catCandidates[0]; // preferred name, e.g. "Torry Buch"
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
        // Create Category localized
        const newCat = await payload.create({
          collection: 'categories',
          data: { name: primaryCatName, tenant: TARGET_TENANT_ID },
          locale: 'id',
          overrideAccess: true,
        });
        categoryId = newCat.id as string;

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

      // 6. Pricing Mapping
      let priceValue = origPrice;
      let spreadPriceValue: number | undefined = undefined;
      let discountPercentValue: number | undefined = undefined;

      if (salePrice < origPrice && origPrice > 0) {
        spreadPriceValue = -400;
        discountPercentValue = (1 - (salePrice + 400) / priceValue) * 100;

        // Safety check for discount percent boundaries
        if (discountPercentValue < 0) {
          discountPercentValue = 0;
        } else if (discountPercentValue > 100) {
          discountPercentValue = 100;
        }

        // Round to 2 decimal places
        discountPercentValue = Math.round(discountPercentValue * 100) / 100;
      } else {
        // No sale
        priceValue = salePrice;
      }

      console.log(`   Pricing Output -> price: ${priceValue}, discountPercent: ${discountPercentValue}, spreadPrice: ${spreadPriceValue}`);

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

        // Update product locales for 'en' and 'my'
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

        // Update product locales for 'en' and 'my'
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

    // Move to the next page
    page++;
  }

  // Final clean up
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log(`\n========================================`);
  console.log(`🏁 Scraping and seeding complete!`);
  console.log(`   Target collection handle: ${collectionHandle}`);
  console.log(`   Imported products: ${importedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`========================================`);

  process.exit(0);
}

scrapeAndSeed().catch(err => {
  console.error('Fatal Scraper Error:', err);
  process.exit(1);
});
