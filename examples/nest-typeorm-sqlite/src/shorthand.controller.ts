import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Tag } from './tag.entity'
import { Category } from './category.entity'

@UseCrud({ models: [Tag, Category] })
@ApiTags('shorthand')
@Controller('api')
export class ShorthandController extends CrudControllerBase(['tags','categories']) {}


