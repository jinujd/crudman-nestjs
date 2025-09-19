import 'reflect-metadata'
import { applyDecorators, Get, Post, Put, Patch, Delete, SetMetadata, HttpCode } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiOkResponse, ApiBody } from '../utils/safeSwagger'
import { TypeormAdapter } from '../adapters/typeorm.adapter'
import { CrudmanRegistry } from '../module/CrudmanRegistry'

const CRD_META = 'crudman:meta'

export const UseCrud = (config: any, options?: any): ClassDecorator => {
  return (target: any) => {
    const opts = { defaultOrm: TypeormAdapter, ...(options || {}) }
    const existing = (global as any).__crudman_global_meta || { config: { sections: {} }, options: {} }
    const mergedSections = { ...(existing.config?.sections || {}), ...(config?.sections || {}) }
    const mergedConfig = { ...existing.config, ...config, sections: mergedSections }
    const mergedOptions = { ...existing.options, ...opts }
    const meta = { config: mergedConfig, options: mergedOptions }
    Reflect.defineMetadata(CRD_META, meta, target)
    ;(global as any).__crudman_global_meta = meta
  }
}

export const CrudList = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'list', opts }),
  ApiOperation({ summary: `${section}: list` }),
  ApiOkResponse({ description: 'List response' }),
  Get()
)
export const CrudDetails = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'details', opts }),
  ApiOperation({ summary: `${section}: details` }),
  ApiParam({ name: 'id', required: true }),
  ApiOkResponse({ description: 'Details response' }),
  Get(':id')
)
export const CrudCreate = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'create', opts }),
  ApiOperation({ summary: `${section}: create` }),
  ApiOkResponse({ description: 'Create response' }),
  Post(),
  HttpCode(200)
)
export const CrudUpdate = (section: string, opts?: any) => {
  const method = CrudmanRegistry.get().getUpdateMethod()
  const verbDecorator = method === 'patch' ? Patch(':id') : Put(':id')
  return applyDecorators(
    SetMetadata('crudman:action', { section, action: 'update', opts }),
    ApiOperation({ summary: `${section}: update` }),
    ApiParam({ name: 'id', required: true }),
    ApiOkResponse({ description: 'Update response' }),
    verbDecorator
  )
}
export const CrudDelete = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'delete', opts }),
  ApiOperation({ summary: `${section}: delete` }),
  ApiParam({ name: 'id', required: true }),
  ApiOkResponse({ description: 'Delete response' }),
  Delete(':id')
)
export const CrudSave = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'save', opts }),
  ApiOperation({ summary: `${section}: save (upsert)` }),
  ApiOkResponse({ description: 'Save response' }),
  Post(),
  HttpCode(200)
)

export const getCrudMeta = (target: any) => Reflect.getMetadata(CRD_META, target.constructor || target)

// Bulk operations
export const CrudBulkImport = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'bulkImport', opts }),
  ApiOperation({ summary: `${section}: bulk import` }),
  ApiBody({ description: 'Array of JSON records or CSV text when x-content-type=csv', required: true }),
  ApiOkResponse({ description: 'Bulk import summary' }),
  Post('bulk/import'),
  HttpCode(200)
)

export const CrudBulkDelete = (section: string, opts?: any) => applyDecorators(
  SetMetadata('crudman:action', { section, action: 'bulkDelete', opts }),
  ApiOperation({ summary: `${section}: bulk delete` }),
  ApiBody({ description: 'Body: { ids: [] } or CSV when x-content-type=csv', required: true }),
  ApiOkResponse({ description: 'Bulk delete summary' }),
  Post('bulk/delete'),
  HttpCode(200)
)


