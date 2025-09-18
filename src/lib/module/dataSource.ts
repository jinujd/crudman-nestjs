import { CrudmanRegistry } from './CrudmanRegistry'

export function setCrudmanDataSource(dataSource: any) {
  CrudmanRegistry.get().setDataSource(dataSource)
}

export function getCrudmanDataSource() {
  return CrudmanRegistry.get().getDataSource()
}


