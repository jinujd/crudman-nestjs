import { CrudActionConfig } from './CrudActionConfig'

export interface CrudSectionConfig {
  model: any
  ormType?: 'typeorm' | 'sequelize'
  list?: CrudActionConfig
  details?: CrudActionConfig
  create?: CrudActionConfig
  update?: CrudActionConfig
  delete?: CrudActionConfig
  save?: CrudActionConfig

  fieldsForUniquenessValidation?: string[]
  conditionTypeForUniquenessValidation?: 'or' | 'and'

  requiredRoles?: string[]
  ownership?: { field: string; relation?: string }

  validator?: any
  orm?: any
  swagger?: { enabled?: boolean }
}


