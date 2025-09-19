import { CrudmanRegistry } from '../module/CrudmanRegistry'

export function generateOpenApiSchemaFromEntity(entity: any): any | null {
  try {
    const ds = CrudmanRegistry.get().getDataSource?.()
    if (!ds || !entity) return null
    const meta = safeGetMetadata(ds, entity)
    if (!meta) return null
    const properties: Record<string, any> = {}
    const required: string[] = []
    for (const col of meta.columns) {
      const name = col.propertyName
      const typ = normalizeType(col.type)
      const prop: any = { type: typ }
      if (col.length) prop.maxLength = Number(col.length)
      if (typ === 'integer' || typ === 'number') {}
      if (typ === 'string' && (String(col.type).toLowerCase().includes('date') || col.isCreateDate || col.isUpdateDate)) {
        prop.type = 'string'; prop.format = 'date-time'
      }
      properties[name] = prop
      if (col.isNullable === false && !col.isPrimary && !col.isGenerated && !col.isCreateDate && !col.isUpdateDate) required.push(name)
    }
    return { type: 'object', properties, required: required.length ? required : undefined }
  } catch { return null }
}

export function registerSchemas(swagger: any, app: any, entities: any[]) {
  if (!swagger || !app) return
  const schemas: Record<string, any> = {}
  for (const ent of entities) {
    const name = ent.name || 'Entity'
    const schema = generateOpenApiSchemaFromEntity(ent)
    if (schema) schemas[name] = schema
  }
  if (Object.keys(schemas).length) {
    const doc = swagger.SwaggerModule.createDocument(app, new swagger.DocumentBuilder().setTitle('API').setVersion('1.0').build(), { extraSchemas: schemas })
    swagger.SwaggerModule.setup('docs', app, doc)
  }
}

export function enhanceCrudSwaggerDocument(document: any) {
  if (!document || typeof document !== 'object') return
  const meta = (global as any).__crudman_global_meta || { config: { sections: {} } }
  const sections: Record<string, any> = meta.config?.sections || {}
  if (!document.components) document.components = {}
  if (!document.components.schemas) document.components.schemas = {}

  const sectionToEntityName: Record<string, string> = {}
  for (const [sectionKey, cfg] of Object.entries(sections)) {
    const ent = (cfg as any)?.model
    if (!ent) continue
    const name = ent.name || 'Entity'
    sectionToEntityName[sectionKey] = name
    const schema = generateOpenApiSchemaFromEntity(ent)
    if (schema) {
      document.components.schemas[name] = schema
    }
  }

  const isDetailsPath = (p: string) => /\{id\}$/.test(p)
  const getSectionFromPath = (p: string): string | null => {
    const parts = p.split('/').filter(Boolean)
    if (!parts.length) return null
    // Try last non-parameter segment
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i]
      if (!seg.startsWith('{')) return seg
    }
    return null
  }

  for (const [path, item] of Object.entries<any>(document.paths || {})) {
    const section = getSectionFromPath(path)
    if (!section) continue
    const entityName = sectionToEntityName[section]
    if (!entityName) continue
    const ref = { $ref: `#/components/schemas/${entityName}` }

    // List: GET without id param
    if (item.get && !isDetailsPath(path)) {
      item.get.responses = item.get.responses || {}
      item.get.responses['200'] = item.get.responses['200'] || {}
      item.get.responses['200'].content = {
        'application/json': {
          schema: buildListEnvelopeSchema(ref)
        }
      }
    }
    // Details: GET with id param
    if (item.get && isDetailsPath(path)) {
      item.get.responses = item.get.responses || {}
      item.get.responses['200'] = item.get.responses['200'] || {}
      item.get.responses['200'].content = {
        'application/json': {
          schema: buildDetailEnvelopeSchema(ref)
        }
      }
    }
  }
}

function buildListEnvelopeSchema(itemRef: any) {
  return {
    type: 'object',
    properties: {
      data: { type: 'array', items: itemRef },
      errors: { type: 'array', items: {} },
      success: { type: 'boolean' },
      pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          perPage: { type: 'integer' },
          totalItemsCount: { type: 'integer' },
          totalPagesCount: { type: 'integer' },
          isHavingNextPage: { type: 'boolean' },
          isHavingPreviousPage: { type: 'boolean' }
        }
      },
      filters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            op: { type: 'string' },
            value: {}
          }
        }
      },
      sorting: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            order: { type: 'string', enum: ['ASC', 'DESC'] }
          }
        }
      }
    }
  }
}

function buildDetailEnvelopeSchema(itemRef: any) {
  return {
    type: 'object',
    properties: {
      data: itemRef,
      errors: { type: 'array', items: {} },
      success: { type: 'boolean' }
    }
  }
}

function normalizeType(t: any): string {
  const s = typeof t === 'string' ? t.toLowerCase() : t
  if (s === String || s === 'varchar' || s === 'text' ) return 'string'
  if (s === Number || s === 'int' || s === 'integer' || s === 'float' || s === 'double' || s === 'decimal') return 'number'
  if (s === Boolean || s === 'boolean') return 'boolean'
  if (s === Date || String(s).includes('date') || String(s).includes('time')) return 'string'
  return 'string'
}

function safeGetMetadata(ds: any, entity: any): any | null {
  try { return ds.getMetadata(entity) } catch {
    const all = (ds as any).entityMetadatas || []
    return all.find((m: any) => m.target === entity || m.name === entity?.name) || null
  }
}


