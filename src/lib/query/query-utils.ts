import { FilterItem } from '../types/Filters'
import { SortItem } from '../types/Sorting'
import { PaginationInfo } from '../types/Pagination'

const toCamel = (s: string) => s.replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
const normalizeKeysCamel = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj
  const out: any = {}
  for (const k of Object.keys(obj)) {
    out[toCamel(k)] = obj[k]
  }
  return out
}

export const parsePagination = (
  rawQuery: any,
  names: { page: string; perPage: string; paginate: string },
  opts?: { isPaginationEnabled?: boolean; allowDisable?: boolean; defaultEnabled?: boolean; maxPerPage?: number },
  defaults: { page?: number; perPage?: number } = {}
): { info: PaginationInfo; skip?: number; take?: number; disabled: boolean } => {
  const query = normalizeKeysCamel(rawQuery || {})
  const pageKey = names.page || 'page'
  const perPageKey = names.perPage || 'perPage'
  const paginateKey = names.paginate || 'paginate'
  const enabled = opts?.isPaginationEnabled !== undefined ? opts.isPaginationEnabled : true
  let disabled = false
  let page = Math.max(1, parseInt(query[pageKey] ?? String(defaults.page ?? 1), 10) || 1)
  let perPage = Math.max(1, parseInt(query[perPageKey] ?? String(defaults.perPage ?? 30), 10) || 30)

  // Allow disabling via query
  const pagVal = String(query[paginateKey] ?? '').toLowerCase()
  const isDisableFlag = pagVal === 'false' || pagVal === '0' || pagVal === 'no'
  const isPerPageZero = String(query[perPageKey] ?? '').toLowerCase() === '0'
  if (opts?.allowDisable !== false && (isDisableFlag || isPerPageZero)) disabled = true

  if (opts?.maxPerPage && perPage > opts.maxPerPage) perPage = opts.maxPerPage
  const defaultEnabled = opts?.defaultEnabled !== undefined ? opts.defaultEnabled : true
  if (!enabled) disabled = true
  if (enabled && !defaultEnabled && query[pageKey] === undefined && query[perPageKey] === undefined) disabled = true

  const info: PaginationInfo = {
    page,
    perPage,
    totalItemsCount: 0,
    totalPagesCount: 0,
    isHavingNextPage: false,
    isHavingPreviousPage: page > 1
  }
  if (disabled) return { info, disabled }
  const skip = (page - 1) * perPage
  const take = perPage
  return { info, skip, take, disabled: false }
}

export const parseSorting = (rawQuery: any, whitelist: string[] = [], sortPrefix = 'sort.'): SortItem[] => {
  const query = normalizeKeysCamel(rawQuery || {})
  const result: SortItem[] = []
  for (const key in query) {
    if (!key.startsWith(sortPrefix)) continue
    const field = key.replace(sortPrefix, '')
    if (whitelist.length && !whitelist.includes(field)) continue
    const raw = String(query[key] || 'desc').toLowerCase()
    const order = raw === 'asc' ? 'ASC' : 'DESC'
    result.push({ field, order })
  }
  return result
}

const numericOps = ['min', 'max', 'gt', 'lt'] as const
type NumericOp = typeof numericOps[number]

export const parseFilters = (
  rawQuery: any,
  whitelist: string[] = [],
  ops: { minOp: string; maxOp: string; gtOp: string; ltOp: string; betweenOp: string; likeOp: string } = { minOp: 'min', maxOp: 'max', gtOp: 'gt', ltOp: 'lt', betweenOp: 'between', likeOp: 'like' }
): { where: Record<string, any>; filters: FilterItem[] } => {
  const query = normalizeKeysCamel(rawQuery || {})
  const where: Record<string, any> = {}
  const filters: FilterItem[] = []
  for (const key in query) {
    const val = query[key]
    if (val === undefined || val === null || String(val) === '') continue
    const parts = key.split('.')
    const field = parts[0]
    const op = parts[1]
    if (whitelist.length && !whitelist.includes(field)) continue
    if (!op) {
      where[field] = val
      filters.push({ field, op: 'eq', value: val })
      continue
    }
    const numericOpsConfigured = [ops.minOp, ops.maxOp, ops.gtOp, ops.ltOp]
    if (numericOpsConfigured.includes(op)) {
      where[field] = where[field] || {}
      const n = Number(val)
      if (!Number.isNaN(n)) {
        const mapAny: Record<string, string> = {
          [ops.minOp]: 'gte',
          [ops.maxOp]: 'lte',
          [ops.gtOp]: 'gt',
          [ops.ltOp]: 'lt'
        }
        where[field][mapAny[op]] = n
        filters.push({ field, op: mapAny[op], value: n })
      }
      continue
    }
    if (op === ops.betweenOp) {
      const [start, end] = String(val).split(',')
      where[field] = { between: [start, end] }
      filters.push({ field, op: 'between', value: [start, end] })
      continue
    }
    if (op === ops.likeOp) {
      where[field] = { like: String(val) }
      filters.push({ field, op: 'like', value: String(val) })
      continue
    }
  }
  return { where, filters }
}


