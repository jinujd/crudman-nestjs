import { Get, Post, Put, Delete, Req, Res } from '@nestjs/common'
import { CrudmanService } from '../crudman.service'

export function CrudControllerBase(section: string): any {
  class BaseController {
    constructor(protected readonly crud: CrudmanService) {}

    @Get()
    list(@Req() req: any, @Res() res: any) { return this.crud.list(section, req, res) }

    @Get(':id')
    details(@Req() req: any, @Res() res: any) { return this.crud.details(section, req, res) }

    @Post()
    create(@Req() req: any, @Res() res: any) { return this.crud.create(section, req, res) }

    @Put(':id')
    update(@Req() req: any, @Res() res: any) { return this.crud.update(section, req, res) }

    @Delete(':id')
    remove(@Req() req: any, @Res() res: any) { return this.crud.delete(section, req, res) }
  }
  return BaseController
}


