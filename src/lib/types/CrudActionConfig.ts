export type SortOrder = 'ASC' | 'DESC'

export interface CrudActionConfig {
  onBeforeAction?: (req: any, res: any, service: any) => Promise<boolean | void> | boolean | void
  onAfterAction?: (result: any, req: any, service: any) => Promise<any | void> | any | void
  onBeforeQuery?: (builderOrOpts: any, model: any, req: any, res: any, service: any) => Promise<any> | any
  afterFetch?: (data: any, req: any, res: any, service: any) => Promise<any> | any
  onBeforeValidate?: (req: any, res: any, rules: any, validator: any, service: any) => Promise<boolean | void> | boolean | void
  onAfterValidate?: (req: any, res: any, errors: any[], validator: any, service: any) => Promise<boolean | void> | boolean | void
  getFinalValidationRules?: (generatedRules: any, req: any, res: any, validator: any) => Promise<any> | any

  recordSelectionField?: string
  additionalSettings?: any
  additionalResponse?: Record<string, any>

  relations?: string[]
  getRelations?: (req: any, res: any, cfg: any) => Promise<string[]> | string[]
  attributes?: '*' | string[] | { include?: string[]; exclude?: string[] }
  conditions?: any
  orderBy?: Array<[string, SortOrder]>
  filtersWhitelist?: string[]
  sortingWhitelist?: string[]

  responseHandler?: (result: any, req: any, res: any) => any
  customImplementation?: (tag: 'list'|'details'|'create'|'update'|'delete'|'save', params: any, req: any, res: any) => Promise<any> | any

  enableCache?: boolean | { ttl?: number; key?: (ctx: { section: string; action: string; req: any; relations?: string[] }) => string }
}


