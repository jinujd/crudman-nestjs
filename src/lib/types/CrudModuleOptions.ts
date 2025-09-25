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
  throwOnError?: boolean
  swagger?: { enabled?: boolean; requestBodySchemaMode?: 'inline' | 'ref'; requestBodyContentTypes?: Array<'json' | 'form' | 'multipart'>; includeRelationsInWriteBody?: boolean }
  swaggerMeta?: { title?: string; version?: string; description?: string }
  exportContentTypes?: Array<'json' | 'csv' | 'excel'>
  cache?: { enabled?: boolean; stdTTL?: number; checkperiod?: number; maxKeys?: number; invalidateListsOnWrite?: boolean }
  dataSource?: any // optional TypeORM DataSource; used when ormType: 'typeorm' and repo isn't provided
  updateMethod?: 'put' | 'patch'
  // Upload defaults
  defaultFileStorage?: string
  fileStorages?: Record<string, any>
  uploadLimits?: { maxSizeMB?: number; allowedMimeTypes?: string[] }
  uploadResponse?: {
    fileFieldMode?: 'filename_in_field' | 'key_url_fields'
    includeBaseUrlsOn?: Array<'list'|'details'|'create'|'update'|'save'>
    allowRequestOverride?: boolean
  }
}


