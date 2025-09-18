import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CrudmanModule, UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Company } from './company.entity'
import { Controller } from '@nestjs/common'
import { DataSource } from 'typeorm'

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
class CompaniesController extends CrudControllerBase('companies') {}

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'sqlite', database: 'test.sqlite', entities: [Company], synchronize: true }),
    CrudmanModule.forRoot({}),
  ],
  controllers: [CompaniesController]
})
export class AppModule {}
