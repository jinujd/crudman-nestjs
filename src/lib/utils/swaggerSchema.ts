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
    // Add relation objects by default (document shape as object refs when possible)
    for (const rel of meta.relations || []) {
      const relName = rel.propertyName
      const inv = (rel as any).inverseEntityMetadata
      const relSchemaName = inv?.name || (typeof rel.type === 'function' ? (rel.type as any).name : String(rel.type)) || 'Entity'
      properties[relName] = { $ref: `#/components/schemas/${relSchemaName}` }
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
  const sectionToSelectionField: Record<string, string> = {}
  for (const [sectionKey, cfg] of Object.entries(sections)) {
    const ent = (cfg as any)?.model
    if (!ent) continue
    const name = ent.name || 'Entity'
    sectionToEntityName[sectionKey] = name
    const selectionField = (cfg as any)?.recordSelectionField || 'id'
    sectionToSelectionField[sectionKey] = selectionField
    // Register main entity schema
    const schema = generateOpenApiSchemaFromEntity(ent)
    if (schema) document.components.schemas[name] = schema
    // Also register direct relation target schemas
    try {
      const ds = CrudmanRegistry.get().getDataSource?.()
      const meta = ds ? safeGetMetadata(ds, ent) : null
      const relTargets: any[] = meta?.relations?.map((r: any) => r.inverseEntityMetadata?.target).filter(Boolean) || []
      for (const tgt of relTargets) {
        const tgtName = (tgt as any).name || 'Entity'
        if (!document.components.schemas[tgtName]) {
          const tgtSchema = generateOpenApiSchemaFromEntity(tgt)
          if (tgtSchema) document.components.schemas[tgtName] = tgtSchema
        }
      }
    } catch {}
  }

  const isDetailsPath = (p: string) => /\{[^}]+\}$/.test(p)
  const getSectionFromPath = (p: string): string | null => {
    const parts = p.split('/').filter(Boolean)
    if (!parts.length) return null
    for (let i = parts.length - 1; i >= 0; i--) {
      const seg = parts[i]
      if (!seg.startsWith('{')) return seg
    }
    return null
  }

  // Inject/rename path params according to recordSelectionField
  const newPaths: Record<string, any> = {}
  for (const [path, item] of Object.entries<any>(document.paths || {})) {
    const section = getSectionFromPath(path)
    const entityName = section ? sectionToEntityName[section] : undefined
    const selectionField = section ? sectionToSelectionField[section] || 'id' : 'id'
    if (!entityName) { newPaths[path] = item; continue }

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
    // Details: ensure param name matches selectionField and add param definition
    if (item.get && isDetailsPath(path)) {
      item.get.responses = item.get.responses || {}
      item.get.responses['200'] = item.get.responses['200'] || {}
      item.get.responses['200'].content = {
        'application/json': {
          schema: buildDetailEnvelopeSchema(ref)
        }
      }
      item.get.parameters = item.get.parameters || []
      const hasParam = (item.get.parameters as any[]).some((p) => p.name === selectionField)
      if (!hasParam) (item.get.parameters as any[]).push({ in: 'path', name: selectionField, required: true, schema: { type: 'string' } })
    }
    if (item.patch) {
      item.patch.responses = item.patch.responses || {}
      item.patch.responses['200'] = item.patch.responses['200'] || {}
      item.patch.responses['200'].content = {
        'application/json': {
          schema: buildDetailEnvelopeSchema(ref)
        }
      }
      item.patch.parameters = item.patch.parameters || []
      const hasParam = (item.patch.parameters as any[]).some((p) => p.name === selectionField)
      if (!hasParam) (item.patch.parameters as any[]).push({ in: 'path', name: selectionField, required: true, schema: { type: 'string' } })
    }
    if (item.put) {
      item.put.responses = item.put.responses || {}
      item.put.responses['200'] = item.put.responses['200'] || {}
      item.put.responses['200'].content = {
        'application/json': {
          schema: buildDetailEnvelopeSchema(ref)
        }
      }
      item.put.parameters = item.put.parameters || []
      const hasParam = (item.put.parameters as any[]).some((p) => p.name === selectionField)
      if (!hasParam) (item.put.parameters as any[]).push({ in: 'path', name: selectionField, required: true, schema: { type: 'string' } })
    }
    if (item.delete) {
      item.delete.responses = item.delete.responses || {}
      item.delete.responses['200'] = item.delete.responses['200'] || {}
      item.delete.responses['200'].content = {
        'application/json': {
          schema: buildDeleteEnvelopeSchema()
        }
      }
      item.delete.parameters = item.delete.parameters || []
      const hasParam = (item.delete.parameters as any[]).some((p) => p.name === selectionField)
      if (!hasParam) (item.delete.parameters as any[]).push({ in: 'path', name: selectionField, required: true, schema: { type: 'string' } })
    }

    // If the current path ends with {id} but selectionField is not 'id', clone the path with the right param name
    let finalPath = path
    if (isDetailsPath(path)) {
      finalPath = path.replace(/\{[^}]+\}$/, `{${selectionField}}`)
    }
    newPaths[finalPath] = item
  }
  document.paths = newPaths
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

function buildDeleteEnvelopeSchema() {
  return {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      },
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


