import type { ModuleRef } from '@nestjs/core'

export type HookAction = 'list' | 'details' | 'create' | 'update' | 'save' | 'delete'

export interface HookContext<
  TServices extends Record<string, unknown> = Record<string, unknown>,
  TRepos extends Record<string, unknown> = Record<string, unknown>
> {
  // Reserved (auto-injected)
  service: any
  repository?: any
  moduleRef?: ModuleRef
  section: string
  action: HookAction
  model: any
  dataSource?: any

  // User-provided additions
  services?: TServices
  repositories?: TRepos
  [key: string]: unknown
}

export type ServicesMap = Record<string, unknown>
export type RepositoriesMap = Record<string, unknown>

export type ServicesInput =
  | ServicesMap
  | ((req: any, res: any, cfg: any, moduleRef: ModuleRef) => ServicesMap | Promise<ServicesMap>)

export type RepositoriesInput =
  | RepositoriesMap
  | ((req: any, res: any, cfg: any, moduleRef: ModuleRef) => RepositoriesMap | Promise<RepositoriesMap>)

type ReservedKeys = 'service' | 'repository' | 'moduleRef' | 'section' | 'action' | 'model' | 'dataSource'

export type AdditionalContext =
  Omit<Partial<HookContext>, ReservedKeys> & {
    services?: ServicesInput
    repositories?: RepositoriesInput
  }

export type HookContextBuilder = (
  req: any,
  res: any,
  cfg: any,
  moduleRef: ModuleRef
) => AdditionalContext | Promise<AdditionalContext>

export type HookContextObject = AdditionalContext
export type CrudActionContext = HookContextBuilder | HookContextObject


