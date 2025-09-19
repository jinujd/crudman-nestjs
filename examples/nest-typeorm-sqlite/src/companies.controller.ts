import { Controller, Req, Inject } from '@nestjs/common'
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger'
import { CompanyDto } from './dtos/company.dto'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { Company } from './company.entity'
import { CrudmanService } from 'crudman-nestjs'

@UseCrud({ sections: { companies: { model: Company } } })
@ApiTags('companies')
@Controller('api/companies')
export class CompaniesController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}
  @CrudList('companies')
  list(@Req() req: any) { return this.crud.list('companies', req, undefined) }

  @CrudDetails('companies')
  details(@Req() req: any) { return this.crud.details('companies', req, undefined) }

  @CrudCreate('companies')
  @ApiBody({ type: CompanyDto })
  @ApiOkResponse({ type: CompanyDto })
  create(@Req() req: any) { return this.crud.create('companies', req, undefined) }

  @CrudUpdate('companies')
  update(@Req() req: any) { return this.crud.update('companies', req, undefined) }

  @CrudDelete('companies')
  remove(@Req() req: any) { return this.crud.delete('companies', req, undefined) }

  @CrudSave('companies')
  @ApiBody({ type: CompanyDto })
  @ApiOkResponse({ type: CompanyDto })
  save(@Req() req: any) { return this.crud.save('companies', req, undefined) }
}
