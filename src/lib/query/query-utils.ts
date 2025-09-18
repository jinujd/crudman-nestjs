import { FilterItem } from '../types/Filters'
import { SortItem } from '../types/Sorting'
import { PaginationInfo } from '../types/Pagination'

export const parsePagination = (query: any, defaults: { page?: number; perPage?: number } = {}): { info: PaginationInfo; skip: number; take: number } => {
  const page = Math.max(1, parseInt(query.page ?? defaults.page ?? '1', 10) || 1)
  const perPage = Math.max(1, parseInt(query.per_page ?? query.perPage ?? defaults.perPage ?? '30', 10) || 30)
  const skip = (page - 1) * perPage
  const take = perPage
  const info: PaginationInfo = {
    page,
    perPage,
    totalItemsCount: 0,
    totalPagesCount: 0,
    isHavingNextPage: false,
    isHavingPreviousPage: page > 1
  }
  return { info, skip, take }
}

export const parseSorting = (query: any, whitelist: string[] = []): SortItem[] => {
  const result: SortItem[] = []
  for (const key in query) {
    if (!key.startsWith('sort.')) continue
    const field = key.replace('sort.', '')
    if (whitelist.length && !whitelist.includes(field)) continue
    const raw = String(query[key] || 'desc').toLowerCase()
    const order = raw === 'asc' ? 'ASC' : 'DESC'
    result.push({ field, order })
  }
  return result
}

const numericOps = ['min', 'max', 'gt', 'lt'] as const
type NumericOp = typeof numericOps[number]

export const parseFilters = (query: any, whitelist: string[] = []): { where: Record<string, any>; filters: FilterItem[] } => {
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
    if ((numericOps as readonly string[]).includes(op)) {
      where[field] = where[field] || {}
      const n = Number(val)
      if (!Number.isNaN(n)) {
        const map: Record<NumericOp, string> = { min: 'gte', max: 'lte', gt: 'gt', lt: 'lt' }
        where[field][map[op as NumericOp]] = n
        filters.push({ field, op: map[op as NumericOp], value: n })
      }
      continue
    }
    if (op === 'between') {
      const [start, end] = String(val).split(',')
      where[field] = { between: [start, end] }
      filters.push({ field, op: 'between', value: [start, end] })
      continue
    }
    if (op === 'like') {
      where[field] = { like: String(val) }
      filters.push({ field, op: 'like', value: String(val) })
      continue
    }
  }
  return { where, filters }
}


