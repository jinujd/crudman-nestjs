import Validator from 'fastest-validator'
import { ValidatorAdapter } from '../types/ValidatorAdapter'
 import { CrudmanRegistry } from '../module/CrudmanRegistry'

export class FastestValidatorAdapter implements ValidatorAdapter {
  private validator: any
  constructor() {
    this.validator = new Validator()
  }

  generateSchemaFromModel(model: any, isUpdate: boolean, exclude: string[] = ['created_at','modified_at','deleted_at']): any {
    const rules: any = {}
    let columns: Array<{ propertyName: string; isNullable?: boolean; type?: any; length?: number; isPrimary?: boolean; isGenerated?: boolean; isCreateDate?: boolean; isUpdateDate?: boolean; hasDefault?: boolean }> = []
    try {
      const ds = CrudmanRegistry.get().getDataSource?.()
      if (ds && model) {
        let meta: any | undefined
        try { meta = ds.getMetadata(model) } catch {}
        if (!meta) {
          const all = (ds as any).entityMetadatas || []
          meta = all.find((m: any) => m.target === model || m.name === model?.name)
        }
        if (meta?.columns?.length) {
          columns = meta.columns.map((c: any) => ({
            propertyName: c.propertyName,
            isNullable: c.isNullable,
            type: c.type,
            length: c.length,
            isPrimary: c.isPrimary,
            isGenerated: c.isGenerated,
            isCreateDate: c.isCreateDate,
            isUpdateDate: c.isUpdateDate,
            hasDefault: c.default !== undefined
          }))
        }
      }
    } catch {
      // ignore, fallback below
    }
    if (!columns.length) {
      columns = (model?.columns || model?.prototype?._columns || []) as any
    }

    if (Array.isArray(columns) && columns.length) {
      for (const col of columns) {
        const field = col.propertyName
        if (!field) continue
        if (exclude.includes(field)) continue
        if (!isUpdate && field === 'id') continue
        // Skip generated/auto timestamp columns for validation, but allow id in updates
        if (col.isPrimary || col.isGenerated || col.isCreateDate || col.isUpdateDate) {
          if (isUpdate && field === 'id') {
            rules.id = { type: 'any', optional: true }
          }
          continue
        }

        const rule: any = {}
        // Requiredness: if column is non-nullable but has a DB default, keep it optional.
        // Otherwise, reflect nullability.
        if (col.isNullable === false && !col.hasDefault) rule.optional = false
        else rule.optional = true

        const typ = (typeof col.type === 'string' ? col.type.toLowerCase() : col.type)
        if (typ === 'varchar' || typ === 'text' || typ === String) {
          rule.type = 'string';
          if (col.length) rule.max = Number(col.length)
          // For non-nullable string columns without default, require non-empty string
          if (col.isNullable === false && !col.hasDefault && !isUpdate) rule.min = 1
        } else if (typ === 'int' || typ === 'integer' || typ === Number) {
          rule.type = 'number'; rule.integer = true
        } else if (typ === 'float' || typ === 'double' || typ === 'decimal') {
          rule.type = 'number'
        } else if (typ === 'date' || typ === 'datetime' || typ === 'timestamp' || typ === Date) {
          rule.type = 'date'
        } else if (typ === 'boolean' || typ === Boolean) {
          rule.type = 'boolean'
        } else {
          rule.type = 'any'
        }

        if (isUpdate && field !== 'id') rule.optional = true
        rules[field] = rule
      }
    }
    const fieldKeys = Object.keys(rules).filter(k => !k.startsWith('$$'))
    // For updates, be lenient with extra keys (e.g., framework-injected) by removing them
    rules.$$strict = isUpdate ? 'remove' : fieldKeys.length > 0
    return rules
  }

  validate(input: any, schema: any): { valid: boolean; errors: any[] } {
    const result = this.validator.validate(input, schema)
    return result === true ? { valid: true, errors: [] } : { valid: false, errors: result as any[] }
  }
}


