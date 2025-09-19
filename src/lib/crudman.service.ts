import { Injectable } from '@nestjs/common';
import * as csv from './utils/csv'
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

  getDataSource() {
    return CrudmanRegistry.get().getDataSource()
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
    const base = { model: sectionCfg.model, ...sectionCfg }
    const specific = sectionCfg[action] || {}
    return { ...base, ...specific }
  }

  private async validateIfNeeded(actionCfg: any, req: any, res: any, isUpdate: boolean) {
    const validator = this.getValidator(actionCfg)
    let rules = validator.generateSchemaFromModel(actionCfg.model, isUpdate)
    if (actionCfg.getFinalValidationRules) {
      const mod = await Promise.resolve(actionCfg.getFinalValidationRules(rules, req, res, validator))
      if (mod) rules = mod
    }
    const proceed = await this.applyHooks(actionCfg, 'onBeforeValidate', req, res, rules, validator, this)
    if (proceed === false) return { valid: false, errors: [{ message: 'Validation stopped by onBeforeValidate' }] }
    const input = { ...req.body, ...(req.params || {}) }
    const result = validator.validate(input, rules)
    const proceedAfter = await this.applyHooks(actionCfg, 'onAfterValidate', req, res, result.errors, validator, this)
    if (proceedAfter === false) return { valid: false, errors: result.errors }
    return result
  }

  private send(res: any, body: any) { if (res && !res.headersSent) res.send(body); return body }
  private sendNegotiated(res: any, action: 'list'|'details', result: any) {
    if (!res || res.headersSent) return result
    const headerType = (res.req?.headers?.['x-content-type'] || res.req?.headers?.['X-Content-Type'] || '').toString().toLowerCase()
    const allowed = CrudmanRegistry.get().getExportContentTypes()
    const requested = headerType || 'json'
    const type = allowed.includes(requested as any) ? requested : 'json'
    if (type === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      if (action === 'list') {
        const items = Array.isArray(result?.data) ? result.data : []
        // echo pagination/meta in headers
        const p = result?.pagination || {}
        if (p.totalItemsCount !== undefined) res.setHeader('X-Pagination-Total', String(p.totalItemsCount))
        if (p.page !== undefined) res.setHeader('X-Pagination-Page', String(p.page))
        if (p.perPage !== undefined) res.setHeader('X-Pagination-PerPage', String(p.perPage))
        if (result?.filters) res.setHeader('X-Filters', encodeURIComponent(JSON.stringify(result.filters)))
        if (result?.sorting) res.setHeader('X-Sorting', encodeURIComponent(JSON.stringify(result.sorting)))
        const csvText = csv.toCsvFromArray(items, { flattenDepth: 1 })
        return this.send(res, csvText)
      } else {
        const obj = result?.data || {}
        const csvText = csv.toCsvFromObject(obj, { flattenDepth: 1 })
        return this.send(res, csvText)
      }
    }

    if (type === 'excel') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const ExcelJS = require('exceljs')
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('data')
        const flatten = (input: any, depth = 1, prefix = ''): Record<string, any> => {
          if (!input || typeof input !== 'object') return { [prefix || 'value']: input }
          const out: Record<string, any> = {}
          for (const [k, v] of Object.entries(input)) {
            const key = prefix ? `${prefix}.${k}` : k
            if (v && typeof v === 'object' && depth > 0) Object.assign(out, flatten(v, depth - 1, key))
            else out[key] = v
          }
          return out
        }

        if (action === 'list') {
          const items = Array.isArray(result?.data) ? result.data : []
          const flattened = items.map((i: any) => flatten(i, 1))
          const headersSet = new Set<string>()
          for (const it of flattened) Object.keys(it).forEach((h) => headersSet.add(h))
          const headers = Array.from(headersSet)
          sheet.columns = headers.map((h) => ({ header: h, key: h }))
          for (const it of flattened) {
            const row: Record<string, any> = {}
            for (const h of headers) row[h] = (it as any)[h]
            sheet.addRow(row)
          }
          const p = result?.pagination || {}
          if (p.totalItemsCount !== undefined) res.setHeader('X-Pagination-Total', String(p.totalItemsCount))
          if (p.page !== undefined) res.setHeader('X-Pagination-Page', String(p.page))
          if (p.perPage !== undefined) res.setHeader('X-Pagination-PerPage', String(p.perPage))
          if (result?.filters) res.setHeader('X-Filters', encodeURIComponent(JSON.stringify(result.filters)))
          if (result?.sorting) res.setHeader('X-Sorting', encodeURIComponent(JSON.stringify(result.sorting)))
        } else {
          const obj = result?.data || {}
          const flattened = flatten(obj, 1)
          const headers = Object.keys(flattened)
          sheet.columns = headers.map((h) => ({ header: h, key: h }))
          const row: Record<string, any> = {}
          for (const h of headers) row[h] = (flattened as any)[h]
          sheet.addRow(row)
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"')
        try {
          const buffer: Buffer = await workbook.xlsx.writeBuffer()
          return this.send(res, buffer)
        } catch {
          await workbook.xlsx.write(res)
          return res
        }
      } catch (err) {
        // exceljs not installed or failed → inform user clearly
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        const fmt = this.getResponseFormatter()
        const body = fmt({
          action,
          payload: null,
          errors: [{ message: 'Excel export requires optional dependency "exceljs". Install with: npm i exceljs' }],
          success: false,
          meta: {},
          req: res?.req,
          res
        })
        return this.send(res, body)
      }
    }
    // Default JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return this.send(res, result)
  }

  async list(section: string, req: any, res: any) {
    const sectionCfg = this.getSection(section)
    const actionCfg = this.getActionCfg(section, 'list')
    const orm = this.getOrm(actionCfg)
    if (!sectionCfg || !orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return

    // Default: include all relations unless excluded/overridden
    const baseRels = actionCfg.getRelations ? await actionCfg.getRelations(req, res, actionCfg) : (actionCfg.relations ?? '*')
    const relations = baseRels
    const cache = CrudmanRegistry.get().getCache()
    const cacheCfg = this.getCacheCfg(actionCfg)
    if (cache && cacheCfg) {
      const key = this.cacheKey(section, 'list', req, relations)
      const hit = cache.get<any>(key)
      if (hit) return this.sendNegotiated(res, 'list', hit)
      const payload = await orm.list(req, { ...actionCfg, relations, service: this })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res })
      await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return this.sendNegotiated(res, 'list', body)
    }
    const payload = await orm.list(req, { ...actionCfg, relations, service: this })
    const fmt = this.getResponseFormatter()
    const body = fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.sendNegotiated(res, 'list', body)
  }

  async details(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'details')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    // Default: include all relations unless excluded/overridden
    const baseRels = actionCfg.getRelations ? await actionCfg.getRelations(req, res, actionCfg) : (actionCfg.relations ?? '*')
    const relations = baseRels
    const cache = CrudmanRegistry.get().getCache()
    const cacheCfg = this.getCacheCfg(actionCfg)
    if (cache && cacheCfg) {
      const key = this.cacheKey(section, 'details', req, relations)
      const hit = cache.get<any>(key)
      if (hit) return this.sendNegotiated(res, 'details', hit)
      const entity = await orm.details(req, { ...actionCfg, relations, service: this })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res })
      await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return this.sendNegotiated(res, 'details', body)
    }
    const entity = await orm.details(req, { ...actionCfg, relations, service: this })
    const fmt = this.getResponseFormatter()
    const body = fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.sendNegotiated(res, 'details', body)
  }

  async create(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'create')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const val = await this.validateIfNeeded(actionCfg, req, res, false)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'create', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = await orm.create(req, { ...actionCfg, service: this })
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'create', payload: saved, errors: [], success: true, meta: {}, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  async update(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'update')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const val = await this.validateIfNeeded(actionCfg, req, res, true)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'update', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = await orm.update(req, { ...actionCfg, service: this })
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'update', payload: saved, errors: [], success: true, meta: {}, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  async save(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'save')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const isUpdate = !!(req.params?.id || req.body?.id)
    const val = await this.validateIfNeeded(actionCfg, req, res, isUpdate)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'save', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = orm.save ? await orm.save(req, { ...actionCfg, service: this }) : (isUpdate ? await orm.update(req, { ...actionCfg, service: this }) : await orm.create(req, { ...actionCfg, service: this }))
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'save', payload: saved, errors: [], success: true, meta: {}, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  async delete(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'delete')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    await orm.delete(req, { ...actionCfg, service: this })
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'delete', payload: { message: 'Successfully deleted' }, errors: [], success: true, meta: {}, req, res })
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  private invalidateSection(section: string) {
    const cache = CrudmanRegistry.get().getCache()
    const opts = CrudmanRegistry.get().getOptions()
    if (!cache || !opts.cache?.invalidateListsOnWrite) return
    // naive approach: flush all section list keys by flushing all (node-cache has no namespace)
    cache.flush && cache.flush()
  }

  async callAction(section: string, action: 'list'|'details'|'create'|'update'|'save'|'delete', req: any, res: any, isResponseToBeSent = false): Promise<{ statusCode: number; data: any; headers?: Record<string, any> }> {
    const originalRes = res
    const capture = createResponseCapture(originalRes, isResponseToBeSent)
    let data: any
    switch (action) {
      case 'list': data = await this.list(section, req, capture); break
      case 'details': data = await this.details(section, req, capture); break
      case 'create': data = await this.create(section, req, capture); break
      case 'update': data = await this.update(section, req, capture); break
      case 'save': data = await this.save(section, req, capture); break
      case 'delete': data = await this.delete(section, req, capture); break
      default: data = { success: false, errors: [{ message: 'Invalid action'}] }
    }
    // If the action didn't call res.send, fallback to returned data
    if (!capture.headersSent && data !== undefined) capture.send(data)
    return { statusCode: capture.statusCode, data: capture.getResponse(), headers: capture.headers }
  }
}

function createResponseCapture(originalRes: any, passThrough: boolean) {
  const headers: Record<string, any> = {}
  const capture: any = {
    headersSent: false,
    statusCode: 200,
    headers,
    setHeader: (k: string, v: any) => { headers[k.toLowerCase()] = v; if (passThrough && originalRes?.setHeader) originalRes.setHeader(k, v) },
    status: function (code: number) { this.statusCode = code; if (passThrough && originalRes?.status) originalRes.status(code); return this },
    getResponse: () => capture._data,
    send: (body: any) => {
      capture._data = body
      capture.headersSent = true
      if (passThrough && originalRes && typeof originalRes.send === 'function') originalRes.send(body)
      return capture
    }
  }
  return capture
}

 
