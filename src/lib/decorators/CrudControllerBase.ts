import { Get, Post, Put, Patch, Delete, Req } from '@nestjs/common'
import { CrudmanService } from '../crudman.service'
import { CrudmanRegistry } from '../module/CrudmanRegistry'

export function CrudControllerBase(section: string): any {
  class BaseController {
    protected readonly crud: CrudmanService
    constructor() { this.crud = new CrudmanService() }

    @Get()
    list(@Req() req: any) { return this.crud.list(section, req, undefined) }

    @Get(':id')
    details(@Req() req: any) { return this.crud.details(section, req, undefined) }

    @Post()
    create(@Req() req: any) { return this.crud.create(section, req, undefined) }

    @(CrudmanRegistry.get().getUpdateMethod() === 'patch' ? Patch(':id') : Put(':id'))
    update(@Req() req: any) { return this.crud.update(section, req, undefined) }

    @Delete(':id')
    remove(@Req() req: any) { return this.crud.delete(section, req, undefined) }
  }
  try {
    const proto: any = (BaseController as any).prototype
    const paramMetaKey = 'design:paramtypes'
    // Ensure Swagger has parameter type metadata for decorated params
    ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'list')
    ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'details')
    ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'create')
    ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'update')
    ;(Reflect as any).defineMetadata(paramMetaKey, [Object], proto, 'remove')
  } catch {}
  return BaseController
}


