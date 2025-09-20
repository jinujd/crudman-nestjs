import { PaginationInfo } from './Pagination'

export interface ListResponseEnvelope<T> {
  data: T[]
  errors: any[]
  success: boolean
  pagination: PaginationInfo
  filters: Array<{ field: string; op: string; value: any }>
  sorting: Array<{ field: string; order: 'ASC'|'DESC' }>
  meta?: Record<string, any>
}

export interface DetailResponseEnvelope<T> {
  data: T | null
  errors: any[]
  success: boolean
  meta?: Record<string, any>
}

export type ResponseFormatter<T = any> = (ctx: {
  action: 'list'|'details'|'create'|'update'|'delete'|'save'
  payload: any
  errors: any[]
  success: boolean
  meta?: {
    pagination?: PaginationInfo
    filters?: Array<{ field: string; op: string; value: any }>
    sorting?: Array<{ field: string; order: 'ASC'|'DESC' }>
    extra?: Record<string, any>
    meta?: Record<string, any>
  }
  req: any
  res: any
}) => any


