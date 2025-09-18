import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CrudmanModule } from 'crudman-nestjs'
import { Company } from './company.entity'
import { User } from './user.entity'
import { CompaniesController } from './companies.controller'
import { UsersController } from './users.controller'

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'sqlite', database: 'test.sqlite', entities: [Company, User], synchronize: true }),
    CrudmanModule.forRoot({}),
  ],
  controllers: [CompaniesController, UsersController]
})
export class AppModule {}
