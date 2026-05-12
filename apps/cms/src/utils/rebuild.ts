import { getPayload } from 'payload'
import configPromise from '../payload.config'

/**
 * Triggers a Vercel rebuild using the hook URL stored in the Tenants collection.
 * If tenantId is provided, it triggers only that tenant's hook.
 * If no tenantId is provided, it triggers all active tenants' hooks.
 */
export const triggerVercelRebuild = async (tenantId?: string | number) => {
  const payload = await getPayload({ config: configPromise })

  try {
    // 1. Determine which hooks to trigger
    let hooks: string[] = []

    if (tenantId) {
      // Trigger specific tenant
      const tenant = await payload.findByID({
        collection: 'tenants',
        id: tenantId,
        depth: 0,
      })
      if (tenant?.vercelDeployHookUrl) hooks.push(tenant.vercelDeployHookUrl)
      if (tenant?.cloudflareDeployHookUrl) hooks.push(tenant.cloudflareDeployHookUrl)
    } else {
      // Trigger all active tenants
      const tenants = await payload.find({
        collection: 'tenants',
        where: {
          isActive: { equals: true }
        },
        limit: 100,
        depth: 0,
      })
      
      // Extract all valid hooks
      hooks = tenants.docs.flatMap((t: any) => [
        t.vercelDeployHookUrl, 
        t.cloudflareDeployHookUrl
      ]).filter(Boolean)
    }

    // 2. Fallback to .env if no tenant hooks found
    if (hooks.length === 0) {
      console.log('[Webhook] No tenant-specific hooks found, using global .env fallback if available.')
      if (process.env.VERCEL_DEPLOY_HOOK_URL) hooks.push(process.env.VERCEL_DEPLOY_HOOK_URL)
      if (process.env.CF_PAGES_DEPLOY_HOOK_URL) hooks.push(process.env.CF_PAGES_DEPLOY_HOOK_URL)
    }

    if (hooks.length === 0) {
      console.log('[Webhook] No Deploy Hook URLs found (Payload or .env), skipping.')
      return
    }

    // 3. Trigger hooks in parallel
    console.log(`[Webhook] Triggering ${hooks.length} deploy hook(s)...`)
    
    const results = await Promise.all(
      hooks.map(async (url) => {
        try {
          const response = await fetch(url, { method: 'POST' })
          return { url, ok: response.ok, status: response.status }
        } catch (err) {
          return { url, ok: false, error: err }
        }
      })
    )

    results.forEach((res) => {
      if (res.ok) {
        console.log(`[Webhook] Successfully triggered: ${res.url}`)
      } else {
        console.error(`[Webhook] Failed to trigger: ${res.url}`, res.error || `Status: ${res.status}`)
      }
    })

    return results
  } catch (error) {
    console.error('[Webhook] Error during rebuild trigger process:', error)
    throw error
  }
}
