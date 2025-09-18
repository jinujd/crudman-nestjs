import { OrmAdapter } from './OrmAdapter'
import { ValidatorAdapter } from './ValidatorAdapter'
import { ResponseFormatter } from './ResponseEnvelope'
import { IdentityAccessor, RoleChecker } from './Identity'

export interface CrudModuleOptions {
  defaultOrm?: OrmAdapter
  defaultValidator?: ValidatorAdapter
  defaultResponseFormatter?: ResponseFormatter<any>
  identityAccessor?: IdentityAccessor
  roleChecker?: RoleChecker
  swagger?: { enabled?: boolean }
  cache?: { enabled?: boolean; stdTTL?: number; checkperiod?: number; maxKeys?: number; invalidateListsOnWrite?: boolean }
}


