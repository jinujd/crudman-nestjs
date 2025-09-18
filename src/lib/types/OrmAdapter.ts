export interface OrmAdapter {
  list: (req: any, cfg: any) => Promise<{ items: any[]; pagination?: any; filters?: any[]; sorting?: any[] }>
  details: (req: any, cfg: any) => Promise<any | null>
  create: (req: any, cfg: any) => Promise<any>
  update: (req: any, cfg: any) => Promise<any>
  save?: (req: any, cfg: any) => Promise<any>
  delete: (req: any, cfg: any) => Promise<void>
  exists: (where: any, cfg: any) => Promise<boolean>
  findOne: (where: any, options: any, cfg: any) => Promise<any | null>
  normalizeInput: (input: any, model: any) => any
  buildUniquenessWhere: (id: any, fields: string[], values: any, type: 'or'|'and') => any
}


