import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { statesSection } from './crud/states.section'

@UseCrud({ sections: { states: statesSection() } })
@ApiTags('states')
@Controller('api/states')
export class StatesController extends CrudControllerBase('states') {}


