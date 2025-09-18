import { describe, it, expect } from 'vitest'
import { parsePagination, parseSorting, parseFilters } from '../src/lib/query/query-utils'

describe('query-utils', () => {
  it('parses pagination defaults', () => {
    const { info, skip, take } = parsePagination({})
    expect(info.page).toBe(1)
    expect(info.perPage).toBe(30)
    expect(skip).toBe(0)
    expect(take).toBe(30)
  })

  it('parses sorting with whitelist', () => {
    const s = parseSorting({ 'sort.createdAt': 'asc', 'sort.email': 'desc' }, ['createdAt'])
    expect(s).toEqual([{ field: 'createdAt', order: 'ASC' }])
  })

  it('parses filters with whitelist and operators', () => {
    const { where, filters } = parseFilters({ 'createdAt.between': '2024-01-01,2024-01-31', role: 'admin', 'price.min': '10' }, ['createdAt', 'role', 'price'])
    expect(where.role).toBe('admin')
    expect(where.createdAt.between).toEqual(['2024-01-01', '2024-01-31'])
    expect(where.price.gte).toBe(10)
    expect(filters.length).toBe(3)
  })
})


