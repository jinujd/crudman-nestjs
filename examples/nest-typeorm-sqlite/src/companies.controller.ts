import { Controller, Get, Req, Res, Inject } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { Company } from './company.entity'
import { CrudmanService } from 'crudman-nestjs'

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
export class CompaniesController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}
  @Get()
  @CrudList('companies')
  list(@Req() req: any, @Res() res: any) { return this.crud.list('companies', req, res) }

  @Get(':id')
  @CrudDetails('companies')
  details(@Req() req: any, @Res() res: any) { return this.crud.details('companies', req, res) }

  @CrudCreate('companies')
  create(@Req() req: any, @Res() res: any) { return this.crud.create('companies', req, res) }

  @CrudUpdate('companies')
  update(@Req() req: any, @Res() res: any) { return this.crud.update('companies', req, res) }

  @CrudDelete('companies')
  remove(@Req() req: any, @Res() res: any) { return this.crud.delete('companies', req, res) }

  @CrudSave('companies')
  save(@Req() req: any, @Res() res: any) { return this.crud.save('companies', req, res) }
}
