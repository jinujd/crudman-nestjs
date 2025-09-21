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
    // Save ModuleRef in registry for late/lazy resolutions in service
    registry.setModuleRef(this.moduleRef)
    if (registry.getDataSource()) return

    try {
      // Resolve TypeORM DataSource if present in the app context
      // Use dynamic require to avoid hard dependency on typeorm
      const maybeTypeorm = (() => {
        try { return require('typeorm') } catch { return undefined }
      })()
      const maybeNestTypeorm = (() => {
        try { return require('@nestjs/typeorm') } catch { return undefined }
      })()
      const DataSourceClass = maybeTypeorm && maybeTypeorm.DataSource
      const tokenCandidates: any[] = []
      if (maybeNestTypeorm && typeof maybeNestTypeorm.getDataSourceToken === 'function') {
        try { tokenCandidates.push(maybeNestTypeorm.getDataSourceToken()) } catch {}
        try { tokenCandidates.push(maybeNestTypeorm.getDataSourceToken('default')) } catch {}
      }
      if (DataSourceClass) tokenCandidates.push(DataSourceClass)
      tokenCandidates.push('DataSource', 'DEFAULT_DATA_SOURCE', 'TypeOrmDataSource')

      for (const token of tokenCandidates) {
        if (registry.getDataSource()) break
        try {
          const ds = this.moduleRef.get(token as any, { strict: false })
          if (ds) setCrudmanDataSource(ds)
        } catch {}
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


