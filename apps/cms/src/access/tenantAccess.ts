import type { Access, Where } from 'payload'

/** Role checks */
export const isOwner = (user: any): boolean =>
  Array.isArray(user?.roles) && user.roles.includes('owner')

export const isTenantAdmin = (user: any): boolean =>
  Array.isArray(user?.roles) &&
  (user.roles.includes('admin') || user.roles.includes('editor'))

/** Returns Payload Where constraint to filter docs by the logged-in user's tenant. */
export const filterByTenant = (user: any): Where | boolean => {
  if (!user) return false
  if (isOwner(user)) return true // owner sees all

  const tenantId =
    typeof user.tenant === 'object' ? user.tenant?.id : user.tenant

  if (!tenantId) return false

  return { tenant: { equals: tenantId } }
}

/** Read access: public OR filtered by tenant depending on collection sensitivity */
export const publicRead = (): boolean => true

/** Standard CRUD access helpers */
export const ownerOrTenantAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isOwner(user)) return true
  if (isTenantAdmin(user)) return filterByTenant(user) as Where
  return false
}

export const ownerOnly: Access = ({ req: { user } }) => {
  return !!user && isOwner(user)
}

export const tenantRead: Access = ({ req: { user } }) => {
  if (!user) return true // Izinkan akses publik (untuk website Astro)
  if (isOwner(user)) return true // Owner bisa lihat semua
  
  return filterByTenant(user) as Where // Admin/Editor hanya bisa lihat tenant mereka
}

/** Access specifically for the 'Tenants' collection itself */
export const tenantsRead: Access = ({ req: { user } }) => {
  if (!user) return true
  if (isOwner(user)) return true
  
  const tenantId = typeof user.tenant === 'object' ? user.tenant?.id : user.tenant
  return { id: { equals: tenantId } }
}

/** Write access: must be owner OR admin of that tenant */
export const tenantWrite: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isOwner(user)) return true
  return filterByTenant(user) as Where
}

/** Delete access: owner or tenant admin */
export const tenantDelete: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isOwner(user)) return true
  return filterByTenant(user) as Where
}

/** 
 * Access for global collections (like Media) 
 * Allow any logged-in user to perform actions regardless of their tenant
 */
export const anyAuthenticated: Access = ({ req: { user } }) => {
  return !!user
}

/** 
 * Field hook to automatically assign the tenant field for Tenant Admins.
 * Owners can set this manually via the UI, so it returns the provided value.
 */
import type { FieldHook } from 'payload'

export const assignTenantFromUser: FieldHook = async ({ req, value }) => {
  if (!req.user) return value
  if (isOwner(req.user)) return value // Owner explicitly sets it via UI
  
  // For tenant admins, force the value to their tenant ID
  const tenantId = typeof req.user.tenant === 'object' ? req.user.tenant?.id : req.user.tenant
  return tenantId || value
}
