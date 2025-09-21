import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { blogsSection } from './crud/blogs.section'

@UseCrud({ sections: { blogs: blogsSection() } })
@ApiTags('blogs')
@Controller('api/blogs')
export class BlogsController extends CrudControllerBase('blogs') {}


