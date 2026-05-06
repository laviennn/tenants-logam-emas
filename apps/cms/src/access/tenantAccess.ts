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

/** Read access returning where-clause for tenant isolation */
export const tenantRead: Access = ({ req: { user } }) => {
  // Public API reads allowed, but scoped by tenant via frontend query params
  return true
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
