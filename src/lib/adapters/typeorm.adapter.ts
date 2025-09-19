import { parseFilters, parsePagination, parseSorting } from '../query/query-utils'
import { OrmAdapter } from '../types/OrmAdapter'

// This adapter expects the consumer app to inject repositories via config.additionalSettings.repo
// It operates on a minimal repository interface: find, findOne, save, update, delete, count, createQueryBuilder

export const TypeormAdapter: OrmAdapter = {
  async list(req, cfg) {
    let repo = cfg?.additionalSettings?.repo
    if (!repo) {
      const ds = (cfg.service && (cfg.service as any).getDataSource?.()) || undefined
      // fallback to registry (module options)
      const regDs = (require('../module/CrudmanRegistry') as any).CrudmanRegistry.get().getDataSource()
      const dataSource = ds || regDs
      if (dataSource) repo = dataSource.getRepository(cfg.model)
    }
    if (!repo) throw new Error('Repository not provided (additionalSettings.repo or module dataSource needed)')
    const qn = cfg.queryParamNames || {}
    const pageNames = { page: qn.page || 'page', perPage: qn.perPage || 'perPage', paginate: qn.paginate || 'paginate' }
    const pagOpts = cfg.pagination || {}
    const { info: paginationInfo, skip, take, disabled: paginationDisabled } = parsePagination(req.query, pageNames, pagOpts)
    // If no whitelist provided, default to all entity columns (safe model-scoped default)
    const repoColumns: string[] = Array.isArray(repo?.metadata?.columns)
      ? repo.metadata.columns.map((c: any) => c.propertyName)
      : []
    const effectiveWhitelist: string[] = (cfg.filtersWhitelist && cfg.filtersWhitelist.length)
      ? cfg.filtersWhitelist
      : repoColumns
    const sorting = parseSorting(req.query, effectiveWhitelist, qn.sortPrefix || 'sort.')
    const { where, filters } = parseFilters(req.query, effectiveWhitelist, {
      minOp: qn.minOp || 'min',
      maxOp: qn.maxOp || 'max',
      gtOp: qn.gtOp || 'gt',
      ltOp: qn.ltOp || 'lt',
      betweenOp: qn.betweenOp || 'between',
      likeOp: qn.likeOp || 'like'
    })

    // Keyword search
    const keywordParam = (qn.keyword || cfg.keywordParamName || 'keyword')
    const kwRaw = (req.query ? req.query[keywordParam] : undefined) as string | undefined
    const kwCfg = cfg.keyword || {}
    const kwEnabled = kwCfg.isEnabled !== false
    const kwMin = kwCfg.minLength ?? 2
    const kwCaseSensitive = kwCfg.isCaseSensitive === true
    const kw = (typeof kwRaw === 'string' ? kwRaw.trim() : '')
    let keywordWhereOr: any[] = []
    let requiredRelations: string[] = []
    if (kwEnabled && kw && kw.length >= kwMin) {
      const paths: string[] = Array.isArray(kwCfg.searchableFields) && kwCfg.searchableFields.length
        ? kwCfg.searchableFields
        : repoColumns
      const maxDepth = kwCfg.maxRelationDepth ?? 1
      const likeValue = `%${kw}%`

      // Build OR conditions for each path
      for (const path of paths) {
        const segments = String(path).split('.')
        if (!segments.length || segments.length > 3) continue
        if (segments.length === 1) {
          const col = segments[0]
          if (!repoColumns.includes(col)) continue
          keywordWhereOr.push(buildLikeCondition('root', col, likeValue, kwCaseSensitive))
        } else {
          // nested: relation[.relation].column
          if (segments.length - 1 > maxDepth) continue
          const column = segments.pop() as string
          const relationPath = segments.join('.')
          requiredRelations.push(relationPath)
          keywordWhereOr.push(buildLikeCondition(relationPath, column, likeValue, kwCaseSensitive))
        }
      }
    }

    // Merge relations (existing + required by keyword nested paths)
    const relationsBaseRaw = cfg.getRelations ? await cfg.getRelations(req, null, cfg) : (cfg.relations || undefined)
    const relations = resolveRelations(repo, relationsBaseRaw, requiredRelations)

    // Combine where with keyword OR block
    let whereFinal: any = where
    if (keywordWhereOr.length) {
      // AND existing where with (OR keyword...) semantics; using a structure our helper understands later
      whereFinal = { AND: [ where || {}, { OR: keywordWhereOr } ] }
    }

    const hasLikeFilter = filters.some((f) => f.op === 'like')
    const hasRangeFilter = filters.some((f) => f.op === 'gte' || f.op === 'lte' || f.op === 'gt' || f.op === 'lt' || f.op === 'between')
    let findOptions: any = { where: convertToTypeormWhere(whereFinal), relations, order: toTypeormOrder(sorting), skip, take, select: normalizeSelect(cfg.attributes, repo) }
    if (cfg.onBeforeQuery) {
      const mod = await cfg.onBeforeQuery(findOptions, cfg.model, req, null, cfg.service)
      if (mod) findOptions = mod
    }
    let items: any[] = []
    let total = 0
    if (hasLikeFilter || hasRangeFilter) {
      // Use QueryBuilder for robust LIKE behavior across drivers
      const qb = repo.createQueryBuilder('t')
      // Apply simple filters
      for (const f of filters) {
        if (f.op === 'like') {
          const param = `%${String(f.value)}%`.toLowerCase()
          qb.andWhere(`LOWER(t.${f.field}) LIKE :p_${f.field}`, { [`p_${f.field}`]: param })
        } else if (f.op === 'eq') {
          qb.andWhere(`t.${f.field} = :p_${f.field}`, { [`p_${f.field}`]: f.value })
        } else if (f.op === 'between' && Array.isArray(f.value)) {
          qb.andWhere(`t.${f.field} BETWEEN :p_${f.field}_a AND :p_${f.field}_b`, { [`p_${f.field}_a`]: f.value[0], [`p_${f.field}_b`]: f.value[1] })
        } else if (f.op === 'gte') {
          qb.andWhere(`t.${f.field} >= :p_${f.field}`, { [`p_${f.field}`]: f.value })
        } else if (f.op === 'lte') {
          qb.andWhere(`t.${f.field} <= :p_${f.field}`, { [`p_${f.field}`]: f.value })
        } else if (f.op === 'gt') {
          qb.andWhere(`t.${f.field} > :p_${f.field}`, { [`p_${f.field}`]: f.value })
        } else if (f.op === 'lt') {
          qb.andWhere(`t.${f.field} < :p_${f.field}`, { [`p_${f.field}`]: f.value })
        }
      }
      // Sorting
      for (const s of sorting) {
        qb.addOrderBy(`t.${s.field}`, s.order as any)
      }
      // Pagination
      if (!paginationDisabled) {
        if (typeof skip === 'number') qb.skip(skip)
        if (typeof take === 'number') qb.take(take)
      }
      const resQB = await qb.getManyAndCount()
      items = resQB[0]; total = resQB[1]
      if (paginationDisabled) {
        paginationInfo.page = 1
        paginationInfo.perPage = items.length
        paginationInfo.totalItemsCount = total
        paginationInfo.totalPagesCount = 1
        paginationInfo.isHavingNextPage = false
        paginationInfo.isHavingPreviousPage = false
      } else {
        const totalPagesCount = take ? Math.ceil(total / take) : 0
        paginationInfo.totalItemsCount = total
        paginationInfo.totalPagesCount = totalPagesCount
        paginationInfo.isHavingNextPage = take ? paginationInfo.page < totalPagesCount : false
      }
    } else {
      if (paginationDisabled) {
        items = await repo.find({ where: findOptions.where, relations: findOptions.relations, order: findOptions.order, select: findOptions.select })
        total = items.length
        paginationInfo.page = 1
        paginationInfo.perPage = items.length
        paginationInfo.totalItemsCount = total
        paginationInfo.totalPagesCount = 1
        paginationInfo.isHavingNextPage = false
        paginationInfo.isHavingPreviousPage = false
      } else {
        const res = await repo.findAndCount(findOptions)
        items = res[0]; total = res[1]
        const totalPagesCount = take ? Math.ceil(total / take) : 0
        paginationInfo.totalItemsCount = total
        paginationInfo.totalPagesCount = totalPagesCount
        paginationInfo.isHavingNextPage = take ? paginationInfo.page < totalPagesCount : false
      }
    }
    if (cfg.afterFetch) {
      const mod = await cfg.afterFetch(items, req, null, cfg.service)
      if (mod) items = mod
    }

    return { items, pagination: paginationInfo, filters, sorting }
  },

  async details(req, cfg) {
    let repo = cfg?.additionalSettings?.repo
    if (!repo) {
      const regDs = (require('../module/CrudmanRegistry') as any).CrudmanRegistry.get().getDataSource()
      if (regDs) repo = regDs.getRepository(cfg.model)
    }
    if (!repo) throw new Error('Repository not provided (additionalSettings.repo or module dataSource needed)')
    const field = cfg.recordSelectionField || 'id'
    const value = req.params[field]
    const relationsBaseRaw = cfg.getRelations ? await cfg.getRelations(req, null, cfg) : (cfg.relations || undefined)
    const relations = resolveRelations(repo, relationsBaseRaw, [])
    let findOptions: any = { where: { [field]: castId(value) } as any, relations, select: normalizeSelect(cfg.attributes, repo) }
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
    let repo = cfg?.additionalSettings?.repo
    if (!repo) {
      const regDs = (require('../module/CrudmanRegistry') as any).CrudmanRegistry.get().getDataSource()
      if (regDs) repo = regDs.getRepository(cfg.model)
    }
    if (!repo) throw new Error('Repository not provided (additionalSettings.repo or module dataSource needed)')
    const input = this.normalizeInput(req.body, cfg.model)
    const entity = repo.create ? repo.create(input) : input
    return await repo.save(entity)
  },

  async update(req, cfg) {
    let repo = cfg?.additionalSettings?.repo
    if (!repo) {
      const regDs = (require('../module/CrudmanRegistry') as any).CrudmanRegistry.get().getDataSource()
      if (regDs) repo = regDs.getRepository(cfg.model)
    }
    if (!repo) throw new Error('Repository not provided (additionalSettings.repo or module dataSource needed)')
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
    let repo = cfg?.additionalSettings?.repo
    if (!repo) {
      const regDs = (require('../module/CrudmanRegistry') as any).CrudmanRegistry.get().getDataSource()
      if (regDs) repo = regDs.getRepository(cfg.model)
    }
    if (!repo) throw new Error('Repository not provided (additionalSettings.repo or module dataSource needed)')
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

function normalizeSelect(attrs: any, repo: any): any {
  if (!attrs || attrs === '*') return undefined
  if (Array.isArray(attrs)) return attrs
  if (attrs && typeof attrs === 'object') {
    const cols: string[] = Array.isArray(repo?.metadata?.columns)
      ? repo.metadata.columns.map((c: any) => c.propertyName)
      : []
    if (attrs.include && Array.isArray(attrs.include) && attrs.include.length) return attrs.include
    if (attrs.exclude && Array.isArray(attrs.exclude) && attrs.exclude.length) return cols.filter(c => !attrs.exclude.includes(c))
  }
  return undefined
}

function resolveRelations(repo: any, rels: any, required: string[]): string[] | undefined {
  const allRels: string[] = Array.isArray(repo?.metadata?.relations)
    ? repo.metadata.relations.map((r: any) => r.propertyName)
    : []
  let base: string[]
  if (!rels || rels === '*') {
    base = allRels
  } else if (Array.isArray(rels)) {
    base = rels
  } else if (typeof rels === 'object') {
    if (rels.include && Array.isArray(rels.include)) base = rels.include
    else if (rels.exclude && Array.isArray(rels.exclude)) base = allRels.filter((r) => !rels.exclude.includes(r))
    else base = allRels
  } else {
    base = []
  }
  const merged = Array.from(new Set([ ...base, ...(required || []) ]))
  return merged.length ? merged : undefined
}

function castId(v: any) { const n = Number(v); return Number.isNaN(n) ? v : n }

function buildLikeCondition(relationPath: string, column: string, likeValue: string, caseSensitive: boolean) {
  // We can't access QueryBuilder aliases in find options directly; use a pseudo expression format.
  // Consumer repos that support advanced where can map LOWER() semantics. Here we store intent.
  const target = relationPath === 'root' ? column : `${relationPath}.${column}`
  return caseSensitive
    ? { [target]: { like: likeValue } }
    : { [target]: { ilike: likeValue } } // signal case-insensitive intent
}

// Convert our generic where structure into TypeORM FindOptionsWhere format
function convertToTypeormWhere(where: any): any {
  if (!where) return {}
  // Handle AND/OR composition
  if (where.AND) {
    return (where.AND as any[]).map(convertToTypeormWhere)
  }
  if (where.OR) {
    return (where.OR as any[]).map(convertToTypeormWhere)
  }
  const out: any = {}
  for (const key of Object.keys(where)) {
    const value = where[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('like' in value) {
        const raw = String((value as any).like)
        const pattern = raw.includes('%') ? raw : `%${raw}%`
        out[key] = CaseInsensitiveLike(pattern)
      } else if ('ilike' in value) {
        const raw = String((value as any).ilike)
        const pattern = raw.includes('%') ? raw : `%${raw}%`
        out[key] = CaseInsensitiveLike(pattern)
      } else if ('between' in value && Array.isArray((value as any).between)) {
        const [a, b] = (value as any).between
        out[key] = Between(a, b)
      } else if ('gte' in value || 'lte' in value || 'gt' in value || 'lt' in value) {
        const range: any[] = []
        if ('gte' in value && 'lte' in value) out[key] = Between((value as any).gte, (value as any).lte)
        else if ('gt' in value) out[key] = MoreThan((value as any).gt)
        else if ('gte' in value) out[key] = MoreThanOrEqual((value as any).gte)
        else if ('lt' in value) out[key] = LessThan((value as any).lt)
        else if ('lte' in value) out[key] = LessThanOrEqual((value as any).lte)
      } else {
        // nested relation path: split by dot
        if (key.includes('.')) {
          const [rel, ...rest] = key.split('.')
          const nestedKey = rest.join('.')
          out[rel] = out[rel] || {}
          out[rel][nestedKey] = convertToTypeormWhere({ [nestedKey]: value })[nestedKey]
        } else {
          out[key] = convertToTypeormWhere(value)
        }
      }
    } else {
      out[key] = value
    }
  }
  return out
}

// Helpers that defer importing from typeorm to runtime to avoid hard deps at import time
function Like(pattern: string): any { return dynamicTypeormOperator('Like', pattern) }
function Between(a: any, b: any): any { return dynamicTypeormOperator('Between', a, b) }
function MoreThan(v: any): any { return dynamicTypeormOperator('MoreThan', v) }
function MoreThanOrEqual(v: any): any { return dynamicTypeormOperator('MoreThanOrEqual', v) }
function LessThan(v: any): any { return dynamicTypeormOperator('LessThan', v) }
function LessThanOrEqual(v: any): any { return dynamicTypeormOperator('LessThanOrEqual', v) }
function Raw(...args: any[]): any { return dynamicTypeormOperator('Raw', ...args) }

// Case-insensitive like fallback: lower both sides via simple pattern; we map to Like on lowercased input
function CaseInsensitiveLike(pattern: string): any {
  // Use a LOWER() based Raw expression for cross-database case-insensitive matching
  return Raw((alias: string) => `LOWER(${alias}) LIKE LOWER(:pattern)`, { pattern })
}

function dynamicTypeormOperator(name: string, ...args: any[]): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const typeorm = require('typeorm')
    return (typeorm as any)[name](...args)
  } catch {
    // If typeorm isn't available at import time, just return a shape TypeORM understands minimally
    return { __op: name, __args: args }
  }
}


