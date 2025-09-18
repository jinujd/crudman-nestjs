export interface ValidatorAdapter {
  generateSchemaFromModel: (model: any, isUpdate: boolean, exclude?: string[]) => any
  validate: (input: any, schema: any) => { valid: boolean; errors: any[] }
}


