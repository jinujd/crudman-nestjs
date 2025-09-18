import 'reflect-metadata'
import { applyDecorators, Get, Post, Put, Delete, SetMetadata } from '@nestjs/common'

const CRD_META = 'crudman:meta'

export const UseCrud = (config: any, options?: any): ClassDecorator => {
  return (target: any) => {
    Reflect.defineMetadata(CRD_META, { config, options }, target)
  }
}

export const CrudList = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'list', opts }), Get())
export const CrudDetails = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'details', opts }), Get(':id'))
export const CrudCreate = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'create', opts }), Post())
export const CrudUpdate = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'update', opts }), Put(':id'))
export const CrudDelete = (section: string, opts?: any) => applyDecorators(SetMetadata('crudman:action', { section, action: 'delete', opts }), Delete(':id'))

export const getCrudMeta = (target: any) => Reflect.getMetadata(CRD_META, target.constructor || target)


