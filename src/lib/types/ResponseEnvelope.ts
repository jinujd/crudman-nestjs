import { PaginationInfo } from './Pagination'

export interface ListResponseEnvelope<T> {
  data: T[]
  errors: any[]
  success: boolean
  pagination: PaginationInfo
  filters: Array<{ field: string; op: string; value: any }>
  sorting: Array<{ field: string; order: 'ASC'|'DESC' }>
}

export interface DetailResponseEnvelope<T> {
  data: T | null
  errors: any[]
  success: boolean
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
  }
  req: any
  res: any
}) => any


