export interface Identity {
  id?: number | string
  role?: string
  merchant_id?: number
}

export type IdentityAccessor = (req: any) => Identity
export type RoleChecker = (identity: Identity, requiredRoles?: string[]) => boolean


