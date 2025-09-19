import { Controller, Req, Inject } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { State } from './state.entity'
import { CrudmanService } from 'crudman-nestjs'

@UseCrud({ sections: { states: { model: State } } })
@ApiTags('states')
@Controller('api/states')
export class StatesController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}

  @CrudList('states')
  list(@Req() req: any) { return this.crud.list('states', req, undefined) }

  @CrudDetails('states')
  details(@Req() req: any) { return this.crud.details('states', req, undefined) }

  @CrudCreate('states')
  create(@Req() req: any) { return this.crud.create('states', req, undefined) }

  @CrudUpdate('states')
  update(@Req() req: any) { return this.crud.update('states', req, undefined) }

  @CrudDelete('states')
  remove(@Req() req: any) { return this.crud.delete('states', req, undefined) }

  @CrudSave('states')
  save(@Req() req: any) { return this.crud.save('states', req, undefined) }
}


