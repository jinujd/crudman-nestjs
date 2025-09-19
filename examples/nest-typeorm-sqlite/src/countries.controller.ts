import { Controller, Req, Inject } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { Country } from './country.entity'
import { CrudmanService } from 'crudman-nestjs'

@UseCrud({ sections: { countries: { model: Country } } })
@ApiTags('countries')
@Controller('api/countries')
export class CountriesController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}

  @CrudList('countries')
  list(@Req() req: any) { return this.crud.list('countries', req, undefined) }

  @CrudDetails('countries')
  details(@Req() req: any) { return this.crud.details('countries', req, undefined) }

  @CrudCreate('countries')
  create(@Req() req: any) { return this.crud.create('countries', req, undefined) }

  @CrudUpdate('countries')
  update(@Req() req: any) { return this.crud.update('countries', req, undefined) }

  @CrudDelete('countries')
  remove(@Req() req: any) { return this.crud.delete('countries', req, undefined) }

  @CrudSave('countries')
  save(@Req() req: any) { return this.crud.save('countries', req, undefined) }
}


