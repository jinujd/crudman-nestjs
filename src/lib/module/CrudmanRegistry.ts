import { CrudModuleOptions } from '../types/CrudModuleOptions'
import { ResponseFormatter } from '../types/ResponseEnvelope'
import { NodeCacheAdapter } from '../cache/NodeCacheAdapter'
import { CacheAdapter } from '../cache/CacheAdapter'
import { FastestValidatorAdapter } from '../validation/FastestValidatorAdapter'

export class CrudmanRegistry {
  private static instance: CrudmanRegistry
  private options: CrudModuleOptions
  private cache?: CacheAdapter

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
  getUpdateMethod() { return this.options.updateMethod || 'patch' }
  getSwaggerMeta() { return (this.options as any).swaggerMeta || {} }
}


