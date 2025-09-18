import { Injectable } from '@nestjs/common';
import { CrudmanRegistry } from './module/CrudmanRegistry'
import { defaultResponseFormatter } from './response/defaultResponseFormatter'

@Injectable()
export class CrudmanService {
  private config: any
  private options: any
  constructor() {}

  private getSection(section: string) {
    if (!this.config) {
      const meta = (global as any).__crudman_global_meta
      this.config = meta?.config || { sections: {} }
      this.options = meta?.options || {}
    }
    return this.config.sections[section]
  }

  private getResponseFormatter() {
    return CrudmanRegistry.get().getResponseFormatter() || defaultResponseFormatter
  }

  private getValidator(sectionCfg: any) {
    return sectionCfg.validator || CrudmanRegistry.get().getValidator()
  }

  private getOrm(sectionCfg: any) {
    return sectionCfg.orm || this.options?.defaultOrm
  }

  private async applyHooks(cfg: any, hook: string, ...args: any[]) {
    const fn = cfg?.[hook]
    if (!fn) return undefined
    return await Promise.resolve(fn(...args))
  }

  private getCacheCfg(actionCfg: any) {
    return actionCfg?.enableCache
  }

  private cacheKey(section: string, action: string, req: any, relations?: string[]) {
    const custom = this.getCacheCfg(this.getActionCfg(section, action))
    if (custom && typeof custom === 'object' && custom.key) return custom.key({ section, action, req, relations })
    return `${section}:${action}:${JSON.stringify({ p: req.params, q: req.query, b: req.body, r: relations || [] })}`
  }

  private getActionCfg(section: string, action: string) {
    const sectionCfg = this.getSection(section) || {}
    return sectionCfg[action] || { model: sectionCfg.model, ...sectionCfg }
  }

  private async validateIfNeeded(actionCfg: any, req: any, res: any, isUpdate: boolean) {
    const validator = this.getValidator(actionCfg)
    const rules = validator.generateSchemaFromModel(actionCfg.model, isUpdate)
    const proceed = await this.applyHooks(actionCfg, 'onBeforeValidate', req, res, rules, validator, this)
    if (proceed === false) return { valid: false, errors: [{ message: 'Validation stopped by onBeforeValidate' }] }
    const input = { ...req.body, ...(req.params || {}) }
    const result = validator.validate(input, rules)
    const proceedAfter = await this.applyHooks(actionCfg, 'onAfterValidate', req, res, result.errors, validator, this)
    if (proceedAfter === false) return { valid: false, errors: result.errors }
    return result
  }

  private send(res: any, body: any) { if (res && !res.headersSent) res.send(body); return body }

  async list(section: string, req: any, res: any) {
    const sectionCfg = this.getSection(section)
    const actionCfg = this.getActionCfg(section, 'list')
    const orm = this.getOrm(actionCfg)
    if (!sectionCfg || !orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })

    const relations = actionCfg.getRelations ? await actionCfg.getRelations(req, res, actionCfg) : (actionCfg.relations || [])
    const cache = CrudmanRegistry.get().getCache()
    const cacheCfg = this.getCacheCfg(actionCfg)
    if (cache && cacheCfg) {
      const key = this.cacheKey(section, 'list', req, relations)
      const hit = cache.get<any>(key)
      if (hit) return this.send(res, hit)
      const payload = await orm.list(req, { ...actionCfg, relations })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res })
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return this.send(res, body)
    }
    const payload = await orm.list(req, { ...actionCfg, relations })
    const fmt = this.getResponseFormatter()
    return this.send(res, fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res }))
  }

  async details(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'details')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const relations = actionCfg.getRelations ? await actionCfg.getRelations(req, res, actionCfg) : (actionCfg.relations || [])
    const cache = CrudmanRegistry.get().getCache()
    const cacheCfg = this.getCacheCfg(actionCfg)
    if (cache && cacheCfg) {
      const key = this.cacheKey(section, 'details', req, relations)
      const hit = cache.get<any>(key)
      if (hit) return this.send(res, hit)
      const entity = await orm.details(req, { ...actionCfg, relations })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res })
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return this.send(res, body)
    }
    const entity = await orm.details(req, { ...actionCfg, relations })
    const fmt = this.getResponseFormatter()
    return this.send(res, fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res }))
  }

  async create(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'create')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const val = await this.validateIfNeeded(actionCfg, req, res, false)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'create', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const saved = await orm.create(req, actionCfg)
    this.invalidateSection(section)
    return this.send(res, this.getResponseFormatter()({ action: 'create', payload: saved, errors: [], success: true, meta: {}, req, res }))
  }

  async update(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'update')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const val = await this.validateIfNeeded(actionCfg, req, res, true)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'update', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const saved = await orm.update(req, actionCfg)
    this.invalidateSection(section)
    return this.send(res, this.getResponseFormatter()({ action: 'update', payload: saved, errors: [], success: true, meta: {}, req, res }))
  }

  async save(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'save')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const isUpdate = !!(req.params?.id || req.body?.id)
    const val = await this.validateIfNeeded(actionCfg, req, res, isUpdate)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'save', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const saved = orm.save ? await orm.save(req, actionCfg) : (isUpdate ? await orm.update(req, actionCfg) : await orm.create(req, actionCfg))
    this.invalidateSection(section)
    return this.send(res, this.getResponseFormatter()({ action: 'save', payload: saved, errors: [], success: true, meta: {}, req, res }))
  }

  async delete(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'delete')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    await orm.delete(req, actionCfg)
    this.invalidateSection(section)
    return this.send(res, this.getResponseFormatter()({ action: 'delete', payload: { message: 'Successfully deleted' }, errors: [], success: true, meta: {}, req, res }))
  }

  private invalidateSection(section: string) {
    const cache = CrudmanRegistry.get().getCache()
    const opts = CrudmanRegistry.get().getOptions()
    if (!cache || !opts.cache?.invalidateListsOnWrite) return
    // naive approach: flush all section list keys by flushing all (node-cache has no namespace)
    cache.flush && cache.flush()
  }
}

 
