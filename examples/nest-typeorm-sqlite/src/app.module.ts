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
import { CustomController } from './custom.controller'
import { Tag } from './tag.entity'
import { Category } from './category.entity'
import { ShorthandController } from './shorthand.controller'
import { Profile } from './profile.entity'
import { ProfilesController } from './profiles.controller'
import { UploadDemo } from './upload-demo.entity'
import { FileUploadsController } from './file-uploads.controller'
import { ImageUploadsController } from './image-uploads.controller'

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: 'sqlite', database: 'test.sqlite', entities: [Company, User, Country, State, Tag, Category, Profile, UploadDemo], synchronize: true }),
    CrudmanModule.forRoot({
      swaggerMeta: { title: 'Example API', version: '1.2.3' },
      defaultFileStorage: 'local',
      fileStorages: { local: { type: 'local', dest: 'uploads', publicBaseUrl: 'http://localhost:3001/uploads' } }
    }),
  ],
  controllers: [CompaniesController, UsersController, CountriesController, StatesController, CustomController, ShorthandController, ProfilesController, FileUploadsController, ImageUploadsController]
})
export class AppModule {}
