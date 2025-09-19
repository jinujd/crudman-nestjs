import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { usersSection } from './crud/users.section'

@UseCrud({ sections: { users: usersSection() } })
@ApiTags('users')
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
