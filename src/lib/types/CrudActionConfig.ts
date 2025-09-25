export type SortOrder = 'ASC' | 'DESC'

export interface CrudActionConfig {
  onBeforeAction?: (req: any, res: any, ctx: import('./HookContext').HookContext) => Promise<boolean | void> | boolean | void
  onAfterAction?: (result: any, req: any, ctx: import('./HookContext').HookContext) => Promise<any | void> | any | void
  onBeforeQuery?: (builderOrOpts: any, model: any, ctx: import('./HookContext').HookContext, req: any, res: any) => Promise<any> | any
  onAfterFetch?: (data: any, req: any, ctx: import('./HookContext').HookContext, res: any) => Promise<any> | any
  onBeforeValidate?: (req: any, res: any, ctx: import('./HookContext').HookContext, rules: any, validator: any) => Promise<boolean | void> | boolean | void
  onAfterValidate?: (req: any, res: any, ctx: import('./HookContext').HookContext, errors: any[], validator: any) => Promise<boolean | void> | boolean | void
  getFinalValidationRules?: (generatedRules: any, ctx: import('./HookContext').HookContext, req: any, res: any, validator: any) => Promise<any> | any

  recordSelectionField?: string
  additionalSettings?: any
  additionalResponse?: Record<string, any> | ((req: any, res: any, currentResponse: any) => any | Promise<any>)
  // New alias with clearer naming. If provided, it will be merged with additionalResponse
  getAdditionalResponse?: (req: any, res: any, currentResponse: any) => any | Promise<any>

  relations?: '*' | string[] | { include?: string[]; exclude?: string[] }
  getRelations?: (req: any, res: any, cfg: any) => Promise<string[] | { include?: string[]; exclude?: string[] } | '*' | undefined> | (string[] | { include?: string[]; exclude?: string[] } | '*' | undefined)
  attributes?: '*' | string[] | { include?: string[]; exclude?: string[] }
  conditions?: any
  orderBy?: Array<[string, SortOrder]>
  filtersWhitelist?: string[]
  sortingWhitelist?: string[]

  // Keyword search config for list action
  keywordParamName?: string // defaults to 'keyword'
  keyword?: {
    isEnabled?: boolean
    isCaseSensitive?: boolean
    minLength?: number
    searchableFields?: string[] // dot paths: 'name', 'user.name', 'user.profile.email' (max 3 levels)
    maxRelationDepth?: 1 | 2 | 3
  }

  // Query param naming and pagination behavior
  queryParamNames?: {
    page?: string // default 'page'
    perPage?: string // default 'perPage'
    paginate?: string // default 'paginate'
    sortPrefix?: string // default 'sort.'
    betweenOp?: string // default 'between'
    minOp?: string // default 'min'
    maxOp?: string // default 'max'
    gtOp?: string // default 'gt'
    ltOp?: string // default 'lt'
    likeOp?: string // default 'like'
    keyword?: string // default 'keyword'
  }
  pagination?: {
    isPaginationEnabled?: boolean // default true
    isDisableAllowed?: boolean // default true (honor paginate=false or perPage=0)
    isDefaultEnabled?: boolean // default true; if false and no page/perPage, return all
    maxPerPage?: number // optional cap
  }

  responseHandler?: (result: any, req: any, res: any) => any
  customImplementation?: (tag: 'list'|'details'|'create'|'update'|'delete'|'save', params: any, req: any, res: any) => Promise<any> | any

  enableCache?: boolean | { ttl?: number; key?: (ctx: { section: string; action: string; req: any; relations?: string[] }) => string }

  // Uploads
  upload?: import('./Upload').UploadConfig
  uploadable?: Record<string, string>
  uploadDefaults?: { storage?: string; dir?: string; keyPrefix?: string; deleteOnReplace?: boolean; imageMaxSizeMB?: number; fileMaxSizeMB?: number }

  // Uniqueness validation (optional overrides per action)
  fieldsForUniquenessValidation?: string[]
  conditionTypeForUniquenessValidation?: 'or' | 'and'

  // Optional hook context configuration (user-provided additions)
  context?: import('./HookContext').CrudActionContext | {
    services?: import('./HookContext').ServicesInput
    repositories?: import('./HookContext').RepositoriesInput
    getHookContext?: import('./HookContext').HookContextBuilder
  }
}


