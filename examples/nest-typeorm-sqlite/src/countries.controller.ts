import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { countriesSection } from './crud/countries.section'

@UseCrud({ sections: { countries: countriesSection() } })
@ApiTags('countries')
@Controller('api/countries')
export class CountriesController extends CrudControllerBase('countries') {}


