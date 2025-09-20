import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs'
import * as path from 'path'
import {
  UploadConfig,
  UploadMapEntry,
  UploadSource,
  UploadStorageMode,
  FileStorageAdapter
} from './types/Upload'
import { LocalDiskAdapter } from './utils/localFileStorage'
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

  private expandUploadableShorthand(sectionCfg: any): UploadConfig | undefined {
    const uploadable = sectionCfg?.uploadable
    if (!uploadable || typeof uploadable !== 'object') return sectionCfg?.upload
    const defaults = sectionCfg?.uploadDefaults || {}
    const out: UploadConfig = { sources: ['multipart'], map: [] }
    const ensureArray = (v: any) => Array.isArray(v) ? v : (v ? [v] : [])
    for (const [baseField, raw] of Object.entries<any>(uploadable)) {
      const spec = String(raw || '').trim()
      const isArray = spec.includes('[]')
      const mode: UploadStorageMode = spec.includes(':base64') ? 'base64' : (spec.includes(':blob') ? 'blob' : 'filename')
      const typeHint = spec.split(':')[0].replace('[]','') // image|video|pdf|doc|any
      const sources: UploadSource[] = defaults.sources || ['multipart']
      const validators = (() => {
        if (defaults.validators) return defaults.validators
        if (typeHint === 'image') return { allowedMimeTypes: ['image/jpeg','image/png','image/gif','image/webp'] }
        if (typeHint === 'video') return { allowedMimeTypes: ['video/mp4','video/webm','video/ogg'] }
        if (typeHint === 'pdf') return { allowedExtensions: ['.pdf'] }
        if (typeHint === 'doc') return { allowedExtensions: ['.pdf','.doc','.docx'] }
        return {}
      })()
      const storage = defaults.storage || CrudmanRegistry.get().getOptions()?.defaultFileStorage
      const entry: UploadMapEntry = {
        sourceField: baseField,
        targetField: (() => {
          if (mode === 'filename') {
            return isArray ? { keys: `${baseField}Keys`, urls: `${baseField}Urls` } : { key: `${baseField}Key`, url: `${baseField}Url` }
          }
          if (mode === 'blob') return { blob: `${baseField}Blob`, mime: `${baseField}Mime` }
          // base64
          return `${baseField}Base64`
        })(),
        isArray,
        storageMode: mode,
        storage,
        sources,
        validators
      }
      out.map.push(entry)
    }
    // merge any explicit upload.map
    if (sectionCfg?.upload?.map?.length) out.map.push(...ensureArray(sectionCfg.upload.map))
    return out
  }

  private getEffectiveUploadCfg(actionCfg: any): UploadConfig | undefined {
    // action overrides section-level
    const fromAction: UploadConfig | undefined = actionCfg?.upload
    if (fromAction?.map?.length) return fromAction
    return this.expandUploadableShorthand(actionCfg)
  }

  private getStorageAdapter(name?: string): FileStorageAdapter | undefined {
    const cfg = CrudmanRegistry.get().getFileStorage(name)
    if (!cfg) return undefined
    if (cfg.type === 'local') {
      return new LocalDiskAdapter({ dest: cfg.dest || 'uploads', publicBaseUrl: cfg.publicBaseUrl })
    }
    return cfg as FileStorageAdapter
  }

  private async readFileBufferIfPath(file: any): Promise<Buffer | undefined> {
    if (file?.buffer) return file.buffer as Buffer
    if (file?.path) {
      try { return await fs.readFile(file.path) } catch { return undefined }
    }
    return undefined
  }

  private async processUploads(section: string, actionCfg: any, req: any): Promise<void> {
    const uploadCfg = this.getEffectiveUploadCfg(actionCfg)
    if (!uploadCfg || !uploadCfg.map || !uploadCfg.map.length) return
    const files: any[] = Array.isArray(req?.files) ? req.files : []
    for (const rule of uploadCfg.map) {
      const field = rule.sourceField
      const incomingFiles = files.filter((f) => f && String(f.fieldname) === field)
      const base64Value = req?.body?.[field]
      const items: Array<{ buffer?: Buffer; stream?: NodeJS.ReadableStream; base64?: string; mime?: string; filename?: string }> = []
      if (incomingFiles.length) {
        for (const f of incomingFiles) {
          items.push({ buffer: await this.readFileBufferIfPath(f), stream: f.stream, mime: f.mimetype, filename: f.originalname })
        }
      } else if (base64Value) {
        const arr = Array.isArray(base64Value) ? base64Value : [base64Value]
        for (const v of arr) items.push({ base64: String(v), mime: undefined, filename: undefined })
      }
      if (!items.length) continue
      const adapter = this.getStorageAdapter(rule.storage)
      const assign = (key: string, value: any) => { if (!req.body) req.body = {}; (req.body as any)[key] = value }
      if (rule.storageMode === 'filename') {
        if (!adapter) throw new Error('No file storage adapter configured')
        if (rule.isArray) {
          const keys: string[] = []
          const urls: string[] = []
          for (const it of items) {
            const saved = await adapter.save({ buffer: it.buffer, stream: it.stream, base64: it.base64, mime: it.mime, filename: it.filename })
            keys.push(saved.key); if (saved.url) urls.push(saved.url)
          }
          const tf = rule.targetField as any
          if (tf?.keys) assign(tf.keys, keys)
          if (tf?.urls) assign(tf.urls, urls)
        } else {
          const it = items[0]
          const saved = await adapter.save({ buffer: it.buffer, stream: it.stream, base64: it.base64, mime: it.mime, filename: it.filename })
          const tf = rule.targetField as any
          if (tf?.key) assign(tf.key, saved.key)
          if (tf?.url && saved.url) assign(tf.url, saved.url)
        }
      } else if (rule.storageMode === 'base64') {
        const tf = rule.targetField as string
        if (rule.isArray) assign(tf, items.map((it) => it.base64 || ''))
        else assign(tf, items[0].base64 || '')
      } else if (rule.storageMode === 'blob') {
        if (rule.isArray) {
          // Not supported in shorthand for arrays; skip
        } else {
          const it = items[0]
          const buf = it.buffer || (it.base64 ? Buffer.from(String(it.base64).split('base64,').pop() || '', 'base64') : undefined)
          const tf = rule.targetField as any
          if (buf) assign(tf.blob, buf)
          if (tf?.mime) assign(tf.mime, it.mime || 'application/octet-stream')
        }
      }
    }
  }

  private async computeAdditionalResponse(section: string, action: string, actionCfg: any, body: any, req: any, res: any): Promise<any | undefined> {
    let extra: any = undefined
    const add = (obj?: any) => {
      if (obj && typeof obj === 'object') extra = { ...(extra || {}), ...obj }
    }
    // User-specified additionalResponse
    const ar = actionCfg?.additionalResponse
    if (typeof ar === 'function') {
      try { add(await Promise.resolve(ar(req, res, body))) } catch {}
    } else if (ar && typeof ar === 'object') add(ar)

    // Auto imageBases for shorthand uploadable image fields (details/create/update/save only)
    if (['details','create','update','save'].includes(action)) {
      const uploadCfg = this.getEffectiveUploadCfg(actionCfg)
      const imageRules = (uploadCfg?.map || []).filter((m) => m.typeHint === 'image' && m.storageMode === 'filename' && !m.isArray)
      if (imageRules.length) {
        const entity = body?.data
        if (entity && typeof entity === 'object') {
          const bases: Record<string,string> = {}
          for (const r of imageRules) {
            const tf: any = r.targetField
            const urlField = tf?.url
            const keyField = tf?.key
            let url: string | undefined
            if (urlField && entity[urlField]) url = String(entity[urlField])
            else if (keyField && entity[keyField]) {
              const adapter = this.getStorageAdapter(r.storage)
              if (adapter?.getUrl) {
                try { const u = await Promise.resolve(adapter.getUrl(String(entity[keyField]))); if (u) url = String(u) } catch {}
              }
            }
            if (url) bases[r.sourceField] = url
          }
          if (Object.keys(bases).length) add({ imageBases: bases })
        }
      }
    }
    return extra
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
  private async sendNegotiated(res: any, action: 'list'|'details', result: any, req?: any) {
    if (!res || res.headersSent) return result
    const rawHeader = (
      req?.headers?.['x-content-type'] || req?.headers?.['X-Content-Type'] || req?.headers?.accept ||
      res?.req?.headers?.['x-content-type'] || res?.req?.headers?.['X-Content-Type'] || res?.req?.headers?.accept ||
      ''
    ).toString().toLowerCase()
    const rawQuery = (req?.query?.['x-content-type'] || req?.query?.['x_content_type'] || req?.query?.format || '').toString().toLowerCase()
    const allowed = CrudmanRegistry.get().getExportContentTypes()
    // normalize aliases and mime types
    const normalized = (() => {
      const source = rawHeader || rawQuery
      if (!source) return ''
      if (source.includes('excel') || source.includes('xlsx') || source.includes('sheet')) return 'excel'
      if (source.includes('csv') || source.includes('text/csv')) return 'csv'
      if (source.includes('json') || source.includes('application/json')) return 'json'
      return source
    })()
    const requested = normalized || 'json'
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
        const body = {
          data: null,
          errors: [{ message: 'Excel export requires optional dependency "exceljs". Install with: npm i exceljs' }],
          success: false
        }
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
      if (hit) return await this.sendNegotiated(res, 'list', hit, req)
      const payload = await orm.list(req, { ...actionCfg, relations, service: this })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res })
      await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return await this.sendNegotiated(res, 'list', body, req)
    }
    const payload = await orm.list(req, { ...actionCfg, relations, service: this })
    const fmt = this.getResponseFormatter()
    const body = fmt({ action: 'list', payload, errors: [], success: true, meta: { pagination: payload.pagination, filters: payload.filters, sorting: payload.sorting }, req, res })
    const extra = await this.computeAdditionalResponse(section, 'list', actionCfg, body, req, res)
    if (extra) (body as any).extra = extra
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
      if (hit) return await this.sendNegotiated(res, 'details', hit, req)
      const entity = await orm.details(req, { ...actionCfg, relations, service: this })
      const fmt = this.getResponseFormatter()
      const body = fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res })
      await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
      cache.set(key, body, typeof cacheCfg === 'object' ? cacheCfg.ttl : undefined)
      return await this.sendNegotiated(res, 'details', body, req)
    }
    const entity = await orm.details(req, { ...actionCfg, relations, service: this })
    const fmt = this.getResponseFormatter()
    const body = fmt({ action: 'details', payload: entity, errors: [], success: !!entity, meta: {}, req, res })
    const extra = await this.computeAdditionalResponse(section, 'details', actionCfg, body, req, res)
    if (extra) (body as any).extra = extra
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.sendNegotiated(res, 'details', body)
  }

  async create(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'create')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    await this.processUploads(section, actionCfg, req)
    const val = await this.validateIfNeeded(actionCfg, req, res, false)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'create', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = await orm.create(req, { ...actionCfg, service: this })
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'create', payload: saved, errors: [], success: true, meta: {}, req, res })
    const extra = await this.computeAdditionalResponse(section, 'create', actionCfg, body, req, res)
    if (extra) (body as any).extra = extra
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  async update(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'update')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    await this.processUploads(section, actionCfg, req)
    const val = await this.validateIfNeeded(actionCfg, req, res, true)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'update', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = await orm.update(req, { ...actionCfg, service: this })
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'update', payload: saved, errors: [], success: true, meta: {}, req, res })
    const extra = await this.computeAdditionalResponse(section, 'update', actionCfg, body, req, res)
    if (extra) (body as any).extra = extra
    await this.applyHooks(actionCfg, 'onAfterAction', body, req, this)
    return this.send(res, body)
  }

  async save(section: string, req: any, res: any) {
    const actionCfg = this.getActionCfg(section, 'save')
    const orm = this.getOrm(actionCfg)
    if (!orm) return this.send(res, { success: false, errors: [{ message: 'Invalid section' }] })
    await this.processUploads(section, actionCfg, req)
    const isUpdate = !!(req.params?.id || req.body?.id)
    const val = await this.validateIfNeeded(actionCfg, req, res, isUpdate)
    if (!val.valid) return this.send(res, this.getResponseFormatter()({ action: 'save', payload: null, errors: val.errors, success: false, meta: {}, req, res }))
    const beforeAction = await this.applyHooks(actionCfg, 'onBeforeAction', req, res, this)
    if (beforeAction === false) return
    const saved = orm.save ? await orm.save(req, { ...actionCfg, service: this }) : (isUpdate ? await orm.update(req, { ...actionCfg, service: this }) : await orm.create(req, { ...actionCfg, service: this }))
    this.invalidateSection(section)
    const body = this.getResponseFormatter()({ action: 'save', payload: saved, errors: [], success: true, meta: {}, req, res })
    const extra = await this.computeAdditionalResponse(section, 'save', actionCfg, body, req, res)
    if (extra) (body as any).extra = extra
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

 
