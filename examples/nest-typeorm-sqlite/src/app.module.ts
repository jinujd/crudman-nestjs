import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CrudmanModule } from 'crudman-nestjs'
import { Company } from './company.entity'
import { User } from './user.entity'
import { Country } from './country.entity'
import { State } from './state.entity'
import { CompaniesController } from './companies.controller'
import { UsersController } from './users.controller'
import { CountriesController } from './countries.controller'
import { StatesController } from './states.controller'

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'sqlite', database: 'test.sqlite', entities: [Company, User, Country, State], synchronize: true }),
    CrudmanModule.forRoot({}),
  ],
  controllers: [CompaniesController, UsersController, CountriesController, StatesController]
})
export class AppModule {}
