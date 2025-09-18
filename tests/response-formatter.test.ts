import { describe, it, expect } from 'vitest'
import { defaultResponseFormatter } from '../src/lib/response/defaultResponseFormatter'

describe('defaultResponseFormatter', () => {
  it('formats list responses', () => {
    const body = defaultResponseFormatter({ action: 'list', payload: { items: [1,2], pagination: { page:1, perPage: 2, totalItemsCount: 2, totalPagesCount:1, isHavingNextPage:false, isHavingPreviousPage:false }, filters: [], sorting: [] }, errors: [], success: true, meta: { pagination: { page:1, perPage: 2, totalItemsCount: 2, totalPagesCount:1, isHavingNextPage:false, isHavingPreviousPage:false }, filters: [], sorting: [] }, req: {}, res: {} })
    expect(body.data.length).toBe(2)
    expect(body.success).toBe(true)
    expect(body.pagination.totalItemsCount).toBe(2)
  })

  it('formats detail responses', () => {
    const body = defaultResponseFormatter({ action: 'details', payload: { id: 1 }, errors: [], success: true, meta: {}, req: {}, res: {} })
    expect(body.data.id).toBe(1)
    expect(body.success).toBe(true)
  })
})


