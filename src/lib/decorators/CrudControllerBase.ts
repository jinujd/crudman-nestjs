import { Get, Post, Put, Patch, Delete, Req, Res, UseInterceptors } from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import { CrudmanService } from '../crudman.service'
import { CrudmanRegistry } from '../module/CrudmanRegistry'
import { applyDecorators, SetMetadata } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiOkResponse, ApiBody } from '../utils/safeSwagger'

export function CrudControllerBase(section: string | string[]): any {
  const paramMetaKey = 'design:paramtypes'

  // Single-section controller (existing behavior)
  if (typeof section === 'string' && section !== '*') {
    const sec = section as string
    class BaseController {
      protected readonly crud: CrudmanService
      constructor() { this.crud = new CrudmanService() }

      @Get()
      list(@Req() req: any, @Res() res: any) { return this.crud.list(sec, req, res) }

      @Get(':id')
      details(@Req() req: any, @Res() res: any) { return this.crud.details(sec, req, res) }

      @Post()
      @UseInterceptors(AnyFilesInterceptor())
      @ApiBody({ required: false, description: 'JSON body or multipart form with files', schema: { type: 'object' } } as any)
      create(@Req() req: any, @Res() res: any) { return this.crud.create(sec, req, res) }

      @(CrudmanRegistry.get().getUpdateMethod() === 'patch' ? Patch(':id') : Put(':id'))
      @UseInterceptors(AnyFilesInterceptor())
      @ApiBody({ required: false, description: 'JSON body or multipart form with files', schema: { type: 'object' } } as any)
      update(@Req() req: any, @Res() res: any) { return this.crud.update(sec, req, res) }

      @Delete(':id')
      remove(@Req() req: any, @Res() res: any) { return this.crud.delete(sec, req, res) }
    }
    try {
      const proto: any = (BaseController as any).prototype
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'list')
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'details')
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'create')
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'update')
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'remove')
    } catch {}
    return BaseController
  }

  // Multi-section shorthand controller: generate routes per section
  class MultiController {
    protected readonly crud: CrudmanService
    constructor() { this.crud = new CrudmanService() }
  }

  try {
    const allowList: string[] = Array.isArray(section) ? section : []
    const updateMethod = CrudmanRegistry.get().getUpdateMethod()
    const proto: any = (MultiController as any).prototype

    const define = (name: string, fn: Function) => {
      Object.defineProperty(proto, name, { value: fn, writable: false, configurable: true })
      ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, name)
    }

    const decorate = (name: string, decorators: any[]) => {
      const desc = Object.getOwnPropertyDescriptor(proto, name) as PropertyDescriptor
      for (const d of decorators) d(proto, name, desc)
    }

    for (const sectionKey of allowList) {
      // list
      const listName = `list__${sectionKey}`
      define(listName, function(this: any, req: any, res: any) { return this.crud.list(sectionKey, req, res) })
      try { (Req() as any)(proto, listName, 0); (Res() as any)(proto, listName, 1) } catch {}
      decorate(listName, [
        applyDecorators(SetMetadata('crudman:action', { section: sectionKey, action: 'list' }), ApiOperation({ summary: `${sectionKey}: list` }), ApiOkResponse({ description: 'List response' })),
        Get(sectionKey)
      ])

      // details
      const detName = `details__${sectionKey}`
      define(detName, function(this: any, req: any, res: any) { return this.crud.details(sectionKey, req, res) })
      try { (Req() as any)(proto, detName, 0); (Res() as any)(proto, detName, 1) } catch {}
      decorate(detName, [
        applyDecorators(SetMetadata('crudman:action', { section: sectionKey, action: 'details' }), ApiOperation({ summary: `${sectionKey}: details` }), ApiParam({ name: 'id', required: true }), ApiOkResponse({ description: 'Details response' })),
        Get(`${sectionKey}/:id`)
      ])

      // create
      const createName = `create__${sectionKey}`
      define(createName, function(this: any, req: any, res: any) { return this.crud.create(sectionKey, req, res) })
      try { (Req() as any)(proto, createName, 0); (Res() as any)(proto, createName, 1) } catch {}
      decorate(createName, [
        UseInterceptors(AnyFilesInterceptor()) as any,
        applyDecorators(SetMetadata('crudman:action', { section: sectionKey, action: 'create' }), ApiOperation({ summary: `${sectionKey}: create` }), ApiOkResponse({ description: 'Create response' }), ApiBody({ required: false, description: 'JSON body or multipart form with files', schema: { type: 'object' } } as any)),
        Post(sectionKey)
      ])

      // update
      const updateName = `update__${sectionKey}`
      define(updateName, function(this: any, req: any, res: any) { return this.crud.update(sectionKey, req, res) })
      try { (Req() as any)(proto, updateName, 0); (Res() as any)(proto, updateName, 1) } catch {}
      decorate(updateName, [
        UseInterceptors(AnyFilesInterceptor()) as any,
        applyDecorators(SetMetadata('crudman:action', { section: sectionKey, action: 'update' }), ApiOperation({ summary: `${sectionKey}: update` }), ApiParam({ name: 'id', required: true }), ApiOkResponse({ description: 'Update response' }), ApiBody({ required: false, description: 'JSON body or multipart form with files', schema: { type: 'object' } } as any)),
        updateMethod === 'patch' ? Patch(`${sectionKey}/:id`) : Put(`${sectionKey}/:id`)
      ])

      // delete
      const removeName = `remove__${sectionKey}`
      define(removeName, function(this: any, req: any, res: any) { return this.crud.delete(sectionKey, req, res) })
      try { (Req() as any)(proto, removeName, 0); (Res() as any)(proto, removeName, 1) } catch {}
      decorate(removeName, [
        applyDecorators(SetMetadata('crudman:action', { section: sectionKey, action: 'delete' }), ApiOperation({ summary: `${sectionKey}: delete` }), ApiParam({ name: 'id', required: true }), ApiOkResponse({ description: 'Delete response' })),
        Delete(`${sectionKey}/:id`)
      ])
    }
  } catch {}

  return MultiController
}


