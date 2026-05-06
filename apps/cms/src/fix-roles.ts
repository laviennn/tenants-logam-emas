import { getPayload } from 'payload'
import configPromise from './payload.config'

async function fixRoles() {
  console.log('⏳ Starting to fix user roles...')
  const payload = await getPayload({ config: configPromise })

  const users = await payload.find({
    collection: 'users',
    limit: 100,
  })

  console.log(`Found ${users.docs.length} users. Setting all to admin...`)

  for (const user of users.docs) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        roles: ['admin'],
      },
    })
    console.log(`✅ Updated user: ${user.email}`)
  }

  console.log('✨ All users have been set to Admin.')
  process.exit(0)
}

fixRoles().catch((err) => {
  console.error('❌ Error fixing roles:', err)
  process.exit(1)
})
