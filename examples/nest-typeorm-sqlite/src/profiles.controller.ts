import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Profile } from './profile.entity'

@UseCrud({ sections: {
  profiles: {
    model: Profile,
    uploadable: { avatar: 'image' },
    uploadDefaults: { storage: 'local' }
  }
}})
@ApiTags('profiles')
@Controller('api/profiles')
export class ProfilesController extends CrudControllerBase('profiles') {}


