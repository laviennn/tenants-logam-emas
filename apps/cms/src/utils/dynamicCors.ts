import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

// Simple cache for whitelisted domains
let cachedDomains: Set<string> = new Set()
let lastFetch = 0
const CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Dynamically validates the origin against the database 'tenants_domains' table.
 * Uses a short-lived cache to prevent database overload on preflight requests.
 */
export const dynamicCors = async (origin: string | undefined): Promise<boolean> => {
  if (!origin) return true

  // 1. Check if cache is fresh
  const now = Date.now()
  if (now - lastFetch > CACHE_TTL) {
    await refreshDomainCache()
  }

  // 2. Normalize origin (strip protocol)
  const hostname = origin.replace(/^https?:\/\//, '').split('/')[0]

  // 3. Check against cache
  if (cachedDomains.has(hostname)) return true

  // 4. Fallback for localhost and common dev origins
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return true

  return false
}

async function refreshDomainCache() {
  try {
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URI,
        max: 5, // Small pool for this specific task
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    }

    // Query the database directly for all active tenant domains
    const query = `
      SELECT td.domain 
      FROM tenants_domains td
      JOIN tenants t ON td._parent_id = t.id
      WHERE t.is_active = true
    `
    const { rows } = await pool.query(query)
    
    const domains = new Set<string>()
    rows.forEach((row: any) => {
      // Normalize: strip protocol if user accidentally included it in CMS
      const d = row.domain.replace(/^https?:\/\//, '').split('/')[0]
      domains.add(d)
    })

    cachedDomains = domains
    lastFetch = Date.now()
    console.log(`[CORS] Cache refreshed. Total domains: ${domains.size}`)
  } catch (error) {
    console.error('[CORS] Failed to refresh domain cache from database:', error)
    // If DB fails, we keep the old cache if available
  }
}
