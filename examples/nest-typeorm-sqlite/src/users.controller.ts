import { Controller, Get } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete, CrudSave } from 'crudman-nestjs'
import { User } from './user.entity'

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController {
  @Get() @CrudList('users') list() {}
  @Get(':id') @CrudDetails('users') details() {}
  @CrudCreate('users') create() {}
  @CrudUpdate('users') update() {}
  @CrudDelete('users') remove() {}
  @CrudSave('users') save() {}
}
