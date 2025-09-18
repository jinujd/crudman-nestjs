import { DynamicModule, Module } from '@nestjs/common'
import { CrudmanService } from '../crudman.service'
import { CrudModuleOptions } from '../types/CrudModuleOptions'
import { CrudmanRegistry } from './CrudmanRegistry'

@Module({
  providers: [CrudmanService],
  exports: [CrudmanService]
})
export class CrudmanModule {
  static forRoot(options: CrudModuleOptions = {}): DynamicModule {
    CrudmanRegistry.init(options)
    return {
      module: CrudmanModule,
      providers: [CrudmanService],
      exports: [CrudmanService]
    }
  }
}


