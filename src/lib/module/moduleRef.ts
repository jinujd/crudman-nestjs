import { CrudmanRegistry } from './CrudmanRegistry'

export function setCrudmanModuleRef(moduleRef: any) {
  CrudmanRegistry.get().setModuleRef(moduleRef)
}

export function getCrudmanModuleRef() {
  return CrudmanRegistry.get().getModuleRef()
}


