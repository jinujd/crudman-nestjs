import { Controller, Req, Inject } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { User } from './user.entity'
import { CrudmanService } from 'crudman-nestjs'

@UseCrud({ sections: { users: { model: User } } })
@ApiTags('users')
@Controller('api/users')
export class UsersController {
  constructor(@Inject(CrudmanService) private readonly crud: CrudmanService) {}

  @CrudList('users')
  list(@Req() req: any) { return this.crud.list('users', req, undefined) }

  @CrudDetails('users')
  details(@Req() req: any) { return this.crud.details('users', req, undefined) }

  @CrudCreate('users')
  create(@Req() req: any) { return this.crud.create('users', req, undefined) }

  @CrudUpdate('users')
  update(@Req() req: any) { return this.crud.update('users', req, undefined) }

  @CrudDelete('users')
  remove(@Req() req: any) { return this.crud.delete('users', req, undefined) }

  @CrudSave('users')
  save(@Req() req: any) { return this.crud.save('users', req, undefined) }
}
