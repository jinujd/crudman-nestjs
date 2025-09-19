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
  swaggerMeta?: { title?: string; version?: string; description?: string }
  exportContentTypes?: Array<'json' | 'csv' | 'excel'>
  cache?: { enabled?: boolean; stdTTL?: number; checkperiod?: number; maxKeys?: number; invalidateListsOnWrite?: boolean }
  dataSource?: any // optional TypeORM DataSource; used when ormType: 'typeorm' and repo isn't provided
  updateMethod?: 'put' | 'patch'
}


