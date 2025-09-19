import { Controller, Get, Post, Patch, Delete, Req, Inject, Body, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave, CrudmanService } from 'crudman-nestjs'
import { Company } from './company.entity'
import { Country } from './country.entity'
import { State } from './state.entity'

@UseCrud({
  sections: {
    companies: { model: Company },
    countries: { model: Country },
    states: { model: State }
  }
})
@ApiTags('custom')
@Controller('api/custom')
export class CustomController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}

  // Custom-named routes mapped to companies CRUD
  @Get('companies/list')
  @CrudList('companies')
  listCompanies(@Req() req: any) { return this.crud.list('companies', req, undefined) }

  @Get('company/details/:id')
  @CrudDetails('companies')
  getCompany(@Req() req: any) { return this.crud.details('companies', req, undefined) }

  @Post('company/create')
  @CrudCreate('companies')
  createCompany(@Req() req: any) { return this.crud.create('companies', req, undefined) }

  @Patch('company/update/:id')
  @CrudUpdate('companies')
  updateCompany(@Req() req: any) { return this.crud.update('companies', req, undefined) }

  @Delete('company/delete/:id')
  @CrudDelete('companies')
  deleteCompany(@Req() req: any) { return this.crud.delete('companies', req, undefined) }

  // Example: callAction composition - create a state under a country
  @Post('countries/:countryId/states')
  async createStateUnderCountry(@Param('countryId') countryId: string, @Body() body: any) {
    const reqLike = { params: {}, body: { name: body?.name, countryId: Number(countryId) } }
    const result = await this.crud.callAction('states', 'save', reqLike, undefined, false)
    return result.data
  }
}


