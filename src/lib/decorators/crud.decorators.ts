import 'reflect-metadata'
import { applyDecorators, Get, Post, Put, Delete, SetMetadata, HttpCode } from '@nestjs/common'
import { TypeormAdapter } from '../adapters/typeorm.adapter'

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

export const CrudList = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'list', opts }), Get())
export const CrudDetails = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'details', opts }), Get(':id'))
export const CrudCreate = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'create', opts }), Post(), HttpCode(200))
export const CrudUpdate = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'update', opts }), Put(':id'))
export const CrudDelete = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'delete', opts }), Delete(':id'))
export const CrudSave = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'save', opts }), Post(), HttpCode(200))

export const getCrudMeta = (target: any) => Reflect.getMetadata(CRD_META, target.constructor || target)


