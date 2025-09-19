import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase, CrudBulkImport, CrudBulkDelete } from 'crudman-nestjs'
import { ApiHeader } from 'crudman-nestjs'
import { statesSection } from './crud/states.section'

@UseCrud({ sections: { states: statesSection() } })
@ApiTags('states')
@Controller('api/states')
export class StatesController extends CrudControllerBase('states') {
  @CrudBulkImport('states')
  @ApiHeader({ name: 'x-content-type', required: false, description: 'Response content type. If not provided, defaults to json. Allowed: json, csv, excel.', schema: { default: 'json', enum: ['json','csv','excel'] } })
  bulkImport() { return { ok: true } }

  @CrudBulkDelete('states')
  @ApiHeader({ name: 'x-content-type', required: false, description: 'Response content type. If not provided, defaults to json. Allowed: json, csv, excel.', schema: { default: 'json', enum: ['json','csv','excel'] } })
  bulkDelete() { return { ok: true } }
}


