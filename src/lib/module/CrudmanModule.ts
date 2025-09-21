import { DynamicModule, Module, OnApplicationBootstrap } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { CrudmanService } from '../crudman.service'
import { CrudModuleOptions } from '../types/CrudModuleOptions'
import { CrudmanRegistry } from './CrudmanRegistry'
import { setCrudmanDataSource } from './dataSource'

@Module({
  providers: [CrudmanService],
  exports: [CrudmanService]
})
export class CrudmanModule implements OnApplicationBootstrap {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationBootstrap() {
    const registry = CrudmanRegistry.get()
    if (registry.getDataSource()) return

    try {
      // Resolve TypeORM DataSource if present in the app context
      // Use dynamic require to avoid hard dependency on typeorm
      const maybeTypeorm = (() => {
        try { return require('typeorm') } catch { return undefined }
      })()
      const DataSourceClass = maybeTypeorm && maybeTypeorm.DataSource
      if (DataSourceClass) {
        const ds = this.moduleRef.get(DataSourceClass, { strict: false })
        if (ds) setCrudmanDataSource(ds)
      }
    } catch {
      // ignore – fallback to manual setCrudmanDataSource if user chooses
    }
  }

  static forRoot(options: CrudModuleOptions = {}): DynamicModule {
    CrudmanRegistry.init(options)
    return {
      module: CrudmanModule,
      providers: [CrudmanService],
      exports: [CrudmanService]
    }
  }
}


