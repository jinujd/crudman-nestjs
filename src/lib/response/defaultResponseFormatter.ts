import { ResponseFormatter } from '../types/ResponseEnvelope'

export const defaultResponseFormatter: ResponseFormatter = ({ action, payload, errors, success, meta }) => {
  if (action === 'list') {
    return {
      data: payload?.items || [],
      errors: errors || [],
      success: success !== false,
      pagination: meta?.pagination || {
        page: 1,
        perPage: 0,
        totalItemsCount: 0,
        totalPagesCount: 0,
        isHavingNextPage: false,
        isHavingPreviousPage: false
      },
      filters: meta?.filters || [],
      sorting: meta?.sorting || [],
      meta: meta?.extra || meta?.meta
    }
  }
  return {
    data: payload || null,
    errors: errors || [],
    success: success !== false,
    meta: meta?.extra || meta?.meta
  }
}


