/** ================================================================
 * cms.ts — Payload CMS client with multi-tenant support
 *
 * Performance strategy:
 * - Tenant resolution is cached in module scope (TTL: 5 min in dev, 60 min in prod)
 * - All data fetches include tenant filter
 * - Images are served directly from Supabase CDN (bypass CMS proxy)
 * ================================================================ */

export const CMS_URL = import.meta.env.PUBLIC_CMS_URL || 'http://localhost:3000'

// ── Tenant Resolution Cache ─────────────────────────────────────
type TenantCache = {
  data: any | null
  expiresAt: number
}

const tenantCache = new Map<string, TenantCache>()
const CACHE_TTL_MS = import.meta.env.DEV ? 0 : 60 * 60 * 1000 // 0ms in dev for instant updates, 60min prod

/**
 * Resolve tenant from hostname. Cached in module scope for performance.
 * Domain index in DB ensures this query is always O(log n).
 */
export const resolveTenant = async (hostname: string): Promise<any | null> => {
  // Normalize hostname (strip port for cache key comparison only)
  const cacheKey = hostname.toLowerCase()

  const cached = tenantCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  try {
    const res = await fetch(
      `${CMS_URL}/api/tenants?where[domains.domain][equals]=${encodeURIComponent(hostname)}&limit=1&depth=0`,
      { cache: 'no-store' },
    )
    if (!res.ok) throw new Error(`Tenant lookup failed: ${res.status}`)
    const json = await res.json()
    const tenant = json.docs?.[0] ?? null

    tenantCache.set(cacheKey, {
      data: tenant,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
    return tenant
  } catch (error) {
    console.error('[CMS] resolveTenant error:', error)
    return null
  }
}

/** Invalidate tenant cache (call after tenant update) */
export const invalidateTenantCache = (hostname?: string) => {
  if (hostname) {
    tenantCache.delete(hostname.toLowerCase())
  } else {
    tenantCache.clear()
  }
}

// ── Image URL Helper ─────────────────────────────────────────────
export const getImageUrl = (image: any, size: string | null = null): string => {
  if (!image) return '/img/emas_hero.jpeg'

  let url = image.url
  if (size && image.sizes?.[size]?.url) {
    url = image.sizes[size].url
  }

  if (!url) return '/img/emas_hero.jpeg'

  const imageKitEndpoint = import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT

  // 1. Handle absolute Supabase URLs returned directly by Payload
  if (imageKitEndpoint && url.includes('supabase.co/storage/v1/object/public/media/')) {
    const filename = url.split('/').pop()
    const endpoint = imageKitEndpoint.replace(/\/$/, '')
    return `${endpoint}/${filename}?tr=f-auto,q-80`
  }

  // 2. Handle relative CMS paths
  if (url.startsWith('/api/media/file/')) {
    const filename = url.split('/').pop()

    if (imageKitEndpoint) {
      const endpoint = imageKitEndpoint.replace(/\/$/, '')
      return `${endpoint}/${filename}?tr=f-auto,q-80`
    }

    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://jlkuxbwuuhxtaguqfskz.supabase.co'
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'jlkuxbwuuhxtaguqfskz'
    return `https://${projectRef}.supabase.co/storage/v1/object/public/media/${filename}`
  }

  if (url.startsWith('http')) return url
  return `${CMS_URL}${url}`
}

// ── Site Settings ────────────────────────────────────────────────
export const getSiteSettings = async (tenantId: number | string, locale = 'id'): Promise<any | null> => {
  try {
    const res = await fetch(
      `${CMS_URL}/api/site-settings?where[tenant][equals]=${tenantId}&locale=${locale}&limit=1&depth=1`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.docs?.[0] ?? null
  } catch (error) {
    console.error('[CMS] getSiteSettings error:', error)
    return null
  }
}

// ── Gold Price ───────────────────────────────────────────────────
export const getGoldPrice = async (tenantId: number | string): Promise<any | null> => {
  try {
    const res = await fetch(
      `${CMS_URL}/api/gold-price?where[tenant][equals]=${tenantId}&limit=1`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.docs?.[0] ?? null
  } catch (error) {
    console.error('[CMS] getGoldPrice error:', error)
    return null
  }
}

// ── Copywriting ──────────────────────────────────────────────────
export const getCopywriting = async (tenantId: number | string, locale = 'id'): Promise<any | null> => {
  try {
    const res = await fetch(
      `${CMS_URL}/api/copywriting?where[tenant][equals]=${tenantId}&locale=${locale}&limit=1&depth=2`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.docs?.[0] ?? null
  } catch (error) {
    console.error('[CMS] getCopywriting error:', error)
    return null
  }
}

// ── Rich Text ────────────────────────────────────────────────────
export const richTextToHtml = (content: any): string => {
  if (!content || !content.root || !content.root.children) return ''

  const serialize = (node: any): string => {
    if (node.type === 'text') {
      let text = node.text
      if (node.format & 1) text = `<strong>${text}</strong>`
      if (node.format & 2) text = `<em>${text}</em>`
      if (node.format & 8) text = `<u>${text}</u>`
      return text
    }

    if (!node.children) return ''
    const childrenHtml = node.children.map((child: any) => serialize(child)).join('')

    switch (node.type) {
      case 'h1': return `<h1>${childrenHtml}</h1>`
      case 'h2': return `<h2>${childrenHtml}</h2>`
      case 'h3': return `<h3>${childrenHtml}</h3>`
      case 'h4': return `<h4>${childrenHtml}</h4>`
      case 'h5': return `<h5>${childrenHtml}</h5>`
      case 'h6': return `<h6>${childrenHtml}</h6>`
      case 'quote': return `<blockquote>${childrenHtml}</blockquote>`
      case 'ul': return `<ul>${childrenHtml}</ul>`
      case 'ol': return `<ol>${childrenHtml}</ol>`
      case 'li': return `<li>${childrenHtml}</li>`
      case 'link': return `<a href="${node.fields?.url || '#'}">${childrenHtml}</a>`
      default: return `<p>${childrenHtml}</p>`
    }
  }

  return content.root.children.map((node: any) => serialize(node)).join('')
}

// ── CSS Theme from Tenant ────────────────────────────────────────
/**
 * Generates CSS custom properties string from tenant theme config.
 * Injected into <head> by BaseLayout for full-page theming without flash.
 */
export const buildTenantCssVars = (tenant: any): string => {
  if (!tenant) return ''

  const vars = {
    '--color-primary': tenant.primaryColor || '#D4AF37',
    '--color-primary-dark': tenant.primaryDarkColor || '#b5952f',
    '--color-secondary': tenant.secondaryColor || '#FFDF00',
    '--color-background-dark': tenant.backgroundDarkColor || '#121212',
    '--color-surface-dark': tenant.surfaceDarkColor || '#1e1e1e',
    '--color-navbar-bg': tenant.navbarBgColor || tenant.primaryColor || '#D4AF37',
    '--color-button': tenant.buttonColor || tenant.primaryColor || '#D4AF37',
    '--color-cart-button': tenant.cartButtonColor || tenant.primaryColor || '#D4AF37',
    '--color-cart-text': (tenant.cartTextColor && tenant.cartTextColor !== '#1e1e1e') ? tenant.cartTextColor : 'var(--color-text-default)',
    '--color-product-title': (tenant.productTitleColor && tenant.productTitleColor !== '#1e1e1e') ? tenant.productTitleColor : 'var(--color-text-default)',
    '--color-product-price': tenant.productPriceColor || '#d97706',
    '--font-family-sans': `'${tenant.fontFamily || 'Inter'}', sans-serif`,
  }

  return Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
}
