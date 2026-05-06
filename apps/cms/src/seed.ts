import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { getPayload } from 'payload'
import config from './payload.config'
import https from 'https'

async function seed() {
  const payload = await getPayload({ config })

  console.log('Seeding Database...')

  // 1. Create User
  const users = await payload.find({ collection: 'users' })
  if (users.totalDocs === 0) {
    await (payload.create as any)({
      collection: 'users',
      data: {
        email: 'admin@logammulia.com',
        password: 'password123',
        roles: ['admin'],
      },
    })
    console.log('Created admin user.')
  }

  // 2. Create Categories
  const categoriesList = [
    { id: 'Antam CertiEye', en: 'Antam CertiEye', my: 'Antam CertiEye' },
    { id: 'Emas Batangan', en: 'Gold Bars', my: 'Jongkong Emas' },
    { id: 'Dinar', en: 'Dinar', my: 'Dinar' },
    { id: 'Gift Series', en: 'Gift Series', my: 'Siri Hadiah' }
  ]
  const createdCategories = []

  for (const cat of categoriesList) {
    const existing = await payload.find({
      collection: 'categories',
      where: { name: { equals: cat.id } },
    })
    
    if (existing.totalDocs === 0) {
      const created = await (payload.create as any)({
        collection: 'categories',
        data: { name: cat.id },
      })
      await (payload.update as any)({ collection: 'categories', id: created.id, locale: 'en', data: { name: cat.en } })
      await (payload.update as any)({ collection: 'categories', id: created.id, locale: 'my', data: { name: cat.my } })
      
      createdCategories.push(created)
      console.log(`Created category: ${cat.id}`)
    } else {
      createdCategories.push(existing.docs[0])
    }
  }

  // Download a dummy image for media
  const imagePath = path.resolve(__dirname, 'dummy-gold.jpg')
  if (!fs.existsSync(imagePath)) {
    await new Promise((resolve, reject) => {
      https.get('https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&q=80', (res) => {
        const stream = fs.createWriteStream(imagePath)
        res.pipe(stream)
        stream.on('finish', () => {
          stream.close()
          resolve(true)
        })
      }).on('error', reject)
    })
  }

  // Create Media
  const mediaResult = await (payload.create as any)({
    collection: 'media',
    data: { alt: 'Gold Image' },
    filePath: imagePath,
  })
  console.log('Created dummy media')

  // 3. Create Products
  const productsList = [
    { id: 'Logam Mulia Antam 1 Gram', en: 'Antam Fine Gold 1 Gram', my: 'Emas Tulen Antam 1 Gram', price: 1520000, categoryIndex: 0 },
    { id: 'Logam Mulia Antam 5 Gram', en: 'Antam Fine Gold 5 Gram', my: 'Emas Tulen Antam 5 Gram', price: 7600000, categoryIndex: 0 },
    { id: 'Logam Mulia Antam 10 Gram', en: 'Antam Fine Gold 10 Gram', my: 'Emas Tulen Antam 10 Gram', price: 15200000, categoryIndex: 0 },
    { id: 'Logam Mulia Antam 25 Gram', en: 'Antam Fine Gold 25 Gram', my: 'Emas Tulen Antam 25 Gram', price: 38000000, categoryIndex: 0 },
  ]

  for (const p of productsList) {
    const existing = await payload.find({
      collection: 'products',
      where: { name: { equals: p.id } },
    })

    if (existing.totalDocs === 0) {
      const prod = await (payload.create as any)({
        collection: 'products',
        data: {
          name: p.id,
          price: p.price,
          category: createdCategories[p.categoryIndex]?.id,
          soldCount: Math.floor(Math.random() * 1000),
          rating: 5,
          image: mediaResult.id,
        },
      })
      
      await (payload.update as any)({ collection: 'products', id: prod.id, locale: 'en', data: { name: p.en } })
      await (payload.update as any)({ collection: 'products', id: prod.id, locale: 'my', data: { name: p.my } })
      
      console.log(`Created product: ${p.id}`)
    }
  }

  // 4. Set Globals
  await (payload.updateGlobal as any)({
    slug: 'gold-price',
    data: {
      currentPrice: 1520000,
      discount: 20000,
    },
  })
  console.log('Updated global: gold-price')

  await (payload.updateGlobal as any)({
    slug: 'site-settings',
    locale: 'id',
    data: {
      metaTitle: 'Logam Mulia Gold Antam',
      metaDescription: 'Platform Jual Beli Emas Antam Terpercaya',
      contactInfo: {
        whatsapp: '6281234567890',
        email: 'info@logammulia.com',
        address: 'Jakarta, Indonesia',
      },
      shippingMethods: [
        { name: 'JNE Reguler', price: 150000 },
        { name: 'J&T Express', price: 160000 },
      ],
      paymentChannels: [
        { bankName: 'BCA', accountName: 'PT Logam Mulia', accountNumber: '1234567890', logo: mediaResult.id },
        { bankName: 'Mandiri', accountName: 'PT Logam Mulia', accountNumber: '0987654321', logo: mediaResult.id },
      ],
    },
  })
  
  await (payload.updateGlobal as any)({
    slug: 'site-settings',
    locale: 'en',
    data: {
      metaTitle: 'Antam Fine Gold',
      metaDescription: 'Trusted Antam Gold Trading Platform',
      shippingMethods: [
        { name: 'JNE Regular', price: 150000 },
        { name: 'J&T Express', price: 160000 },
      ],
      paymentChannels: [
        { bankName: 'BCA', accountName: 'PT Logam Mulia', accountNumber: '1234567890', logo: mediaResult.id },
        { bankName: 'Mandiri', accountName: 'PT Logam Mulia', accountNumber: '0987654321', logo: mediaResult.id },
      ],
    },
  })
  
  await (payload.updateGlobal as any)({
    slug: 'site-settings',
    locale: 'my',
    data: {
      metaTitle: 'Emas Tulen Antam',
      metaDescription: 'Platform Jual Beli Emas Antam Dipercayai',
      shippingMethods: [
        { name: 'JNE Biasa', price: 150000 },
        { name: 'J&T Express', price: 160000 },
      ],
      paymentChannels: [
        { bankName: 'BCA', accountName: 'PT Logam Mulia', accountNumber: '1234567890', logo: mediaResult.id },
        { bankName: 'Mandiri', accountName: 'PT Logam Mulia', accountNumber: '0987654321', logo: mediaResult.id },
      ],
    },
  })
  console.log('Updated global: site-settings')

  console.log('Seeding Complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding Failed:', err)
  process.exit(1)
})
