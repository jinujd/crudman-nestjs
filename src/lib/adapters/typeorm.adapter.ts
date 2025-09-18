import { parseFilters, parsePagination, parseSorting } from '../query/query-utils'
import { OrmAdapter } from '../types/OrmAdapter'

// This adapter expects the consumer app to inject repositories via config.additionalSettings.repo
// It operates on a minimal repository interface: find, findOne, save, update, delete, count, createQueryBuilder

export const TypeormAdapter: OrmAdapter = {
  async list(req, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const { info: paginationInfo, skip, take } = parsePagination(req.query)
    // If no whitelist provided, default to all entity columns (safe model-scoped default)
    const repoColumns: string[] = Array.isArray(repo?.metadata?.columns)
      ? repo.metadata.columns.map((c: any) => c.propertyName)
      : []
    const effectiveWhitelist: string[] = (cfg.filtersWhitelist && cfg.filtersWhitelist.length)
      ? cfg.filtersWhitelist
      : repoColumns
    const sorting = parseSorting(req.query, effectiveWhitelist)
    const { where, filters } = parseFilters(req.query, effectiveWhitelist)

    const relations = cfg.getRelations ? await cfg.getRelations(req, null, cfg) : (cfg.relations || [])
    let findOptions: any = { where, relations, order: toTypeormOrder(sorting), skip, take, select: normalizeSelect(cfg.attributes) }
    if (cfg.onBeforeQuery) {
      const mod = await cfg.onBeforeQuery(findOptions, cfg.model, req, null, cfg.service)
      if (mod) findOptions = mod
    }
    let [items, total] = await repo.findAndCount(findOptions)
    if (cfg.afterFetch) {
      const mod = await cfg.afterFetch(items, req, null, cfg.service)
      if (mod) items = mod
    }
    const totalPagesCount = take ? Math.ceil(total / take) : 0
    paginationInfo.totalItemsCount = total
    paginationInfo.totalPagesCount = totalPagesCount
    paginationInfo.isHavingNextPage = take ? paginationInfo.page < totalPagesCount : false

    return { items, pagination: paginationInfo, filters, sorting }
  },

  async details(req, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const field = cfg.recordSelectionField || 'id'
    const value = req.params[field]
    const relations = cfg.getRelations ? await cfg.getRelations(req, null, cfg) : (cfg.relations || [])
    let findOptions: any = { where: { [field]: castId(value) } as any, relations, select: normalizeSelect(cfg.attributes) }
    if (cfg.onBeforeQuery) {
      const mod = await cfg.onBeforeQuery(findOptions, cfg.model, req, null, cfg.service)
      if (mod) findOptions = mod
    }
    let entity = await repo.findOne(findOptions)
    if (cfg.afterFetch && entity) {
      const mod = await cfg.afterFetch(entity, req, null, cfg.service)
      if (mod) entity = mod
    }
    return entity
  },

  async create(req, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const input = this.normalizeInput(req.body, cfg.model)
    const entity = repo.create ? repo.create(input) : input
    return await repo.save(entity)
  },

  async update(req, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const field = cfg.recordSelectionField || 'id'
    const value = castId(req.params[field] ?? req.body[field])
    const input = this.normalizeInput({ ...req.body, [field]: value }, cfg.model)
    await repo.update({ [field]: value } as any, input)
    return await repo.findOne({ where: { [field]: value } as any })
  },

  async save(req, cfg) {
    const field = cfg.recordSelectionField || 'id'
    if (req.params[field] || req.body[field]) return this.update(req, cfg)
    return this.create(req, cfg)
  },

  async delete(req, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const field = cfg.recordSelectionField || 'id'
    const value = castId(req.params[field])
    await repo.delete({ [field]: value } as any)
  },

  async exists(where, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    const count = await repo.count({ where })
    return count > 0
  },

  async findOne(where, options, cfg) {
    const repo = cfg?.additionalSettings?.repo
    if (!repo) throw new Error('Repository not provided in additionalSettings.repo')
    return await repo.findOne({ where, ...(options || {}) })
  },

  normalizeInput(input, _model) {
    const out: any = { ...input }
    for (const key in out) {
      const val = out[key]
      if (val instanceof Date) continue
      if (typeof val === 'string') {
        const d = new Date(val)
        if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}/.test(val)) out[key] = d
      }
    }
    return out
  },

  buildUniquenessWhere(id, fields, values, type) {
    const clauses = fields.map((f: string) => ({ [f]: values[f] }))
    const where: any = type === 'and' ? { AND: clauses } : { OR: clauses }
    if (id) where.id = { not: id }
    return where
  }
}

function toTypeormOrder(sorting: Array<{ field: string; order: 'ASC'|'DESC' }>): any {
  const order: any = {}
  for (const s of sorting) order[s.field] = s.order
  return order
}

function normalizeSelect(attrs: any): any {
  if (!attrs || attrs === '*') return undefined
  if (Array.isArray(attrs)) return attrs
  // { include, exclude } not directly supported here; keep minimal for now
  return undefined
}

function castId(v: any) { const n = Number(v); return Number.isNaN(n) ? v : n }


