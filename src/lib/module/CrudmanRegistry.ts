import { CrudModuleOptions } from '../types/CrudModuleOptions'
import { ResponseFormatter } from '../types/ResponseEnvelope'
import { NodeCacheAdapter } from '../cache/NodeCacheAdapter'
import { CacheAdapter } from '../cache/CacheAdapter'
import { FastestValidatorAdapter } from '../validation/FastestValidatorAdapter'

export class CrudmanRegistry {
  private static instance: CrudmanRegistry
  private options: CrudModuleOptions
  private cache?: CacheAdapter
  private moduleRef?: any

  private constructor(options: CrudModuleOptions = {}) {
    this.options = options
    if (options.cache?.enabled) {
      this.cache = new NodeCacheAdapter({ stdTTL: options.cache.stdTTL, checkperiod: options.cache.checkperiod, maxKeys: options.cache.maxKeys })
    }
  }

  static init(options: CrudModuleOptions = {}) {
    this.instance = new CrudmanRegistry(options)
  }

  static get(): CrudmanRegistry {
    if (!this.instance) this.instance = new CrudmanRegistry({})
    return this.instance
  }

  getOptions(): CrudModuleOptions { return this.options }
  getCache(): CacheAdapter | undefined { return this.cache }
  getResponseFormatter(): ResponseFormatter<any> | undefined { return this.options.defaultResponseFormatter }
  getValidator() { return this.options.defaultValidator || new FastestValidatorAdapter() }
  getIdentityAccessor() { return this.options.identityAccessor || ((req: any) => req.identity || req.user || {}) }
  getRoleChecker() { return this.options.roleChecker || ((identity: any, roles?: string[]) => !roles?.length || roles.includes(identity?.role)) }
  getDataSource() { return (this.options as any).dataSource }
  setDataSource(ds: any) { (this.options as any).dataSource = ds }
  setModuleRef(ref: any) { this.moduleRef = ref }
  getModuleRef() { return this.moduleRef }
  getUpdateMethod() { return this.options.updateMethod || 'patch' }
  getSwaggerMeta() { return (this.options as any).swaggerMeta || {} }
  getSwaggerRequestBodyContentTypes(): Array<'json'|'form'|'multipart'> {
    const ct = (this.options as any).swagger?.requestBodyContentTypes
    return Array.isArray(ct) && ct.length ? ct as any : ['json','form','multipart']
  }
  getIncludeRelationsInWriteBody(): boolean {
    const v = (this.options as any).swagger?.includeRelationsInWriteBody
    return v === true
  }
  getExportContentTypes(): Array<'json'|'csv'|'excel'> {
    const list = (this.options as any).exportContentTypes
    return Array.isArray(list) && list.length ? list : ['json','csv','excel']
  }
  getFileStorage(name?: string): any {
    const storages = (this.options as any).fileStorages || {}
    const def = (this.options as any).defaultFileStorage
    const key = name || def
    return key ? storages[key] : undefined
  }
  getUploadLimits(): { maxSizeMB?: number; allowedMimeTypes?: string[] } {
    return (this.options as any).uploadLimits || {}
  }

  getUploadResponseOptions(): { fileFieldMode?: 'filename_in_field'|'key_url_fields'; includeBaseUrlsOn?: Array<'list'|'details'|'create'|'update'|'save'>; allowRequestOverride?: boolean } {
    return (this.options as any).uploadResponse || {}
  }
}


