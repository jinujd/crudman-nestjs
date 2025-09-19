import { Get, Post, Put, Patch, Delete, Req, Res } from '@nestjs/common'
import { CrudmanService } from '../crudman.service'
import { CrudmanRegistry } from '../module/CrudmanRegistry'

export function CrudControllerBase(section: string): any {
  class BaseController {
    protected readonly crud: CrudmanService
    constructor() { this.crud = new CrudmanService() }

    @Get()
    list(@Req() req: any, @Res() res: any) { return this.crud.list(section, req, res) }

    @Get(':id')
    details(@Req() req: any, @Res() res: any) { return this.crud.details(section, req, res) }

    @Post()
    create(@Req() req: any, @Res() res: any) { return this.crud.create(section, req, res) }

    @(CrudmanRegistry.get().getUpdateMethod() === 'patch' ? Patch(':id') : Put(':id'))
    update(@Req() req: any, @Res() res: any) { return this.crud.update(section, req, res) }

    @Delete(':id')
    remove(@Req() req: any, @Res() res: any) { return this.crud.delete(section, req, res) }
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


