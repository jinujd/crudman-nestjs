import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { companiesSection } from './crud/companies.section'

@UseCrud({ sections: { companies: companiesSection() } })
@ApiTags('companies')
@Controller('api/companies')
export class CompaniesController extends CrudControllerBase('companies') {}
