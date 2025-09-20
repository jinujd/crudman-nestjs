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
  // Apply global swagger meta (title/version/description) with fallbacks to package.json
  try {
    const reg = CrudmanRegistry.get()
    const cfg = reg.getSwaggerMeta() || {}
    const allowedContentTypes: Array<'json'|'csv'|'excel'> = reg.getExportContentTypes()
    const humanize = (s: string) => String(s || '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/(^|\s)\S/g, (t) => t.toUpperCase())
    let pkg: any = null
    try { pkg = require(process.cwd() + '/package.json') } catch {
      try { pkg = require('../../../../package.json') } catch {}
    }
    const defaultTitle = humanize(pkg?.name || 'API')
    const defaultVersion = pkg?.version || '1.0.0'
    const defaultDescription = `CRUD APIs for ${cfg.title ? humanize(cfg.title) : defaultTitle}`
    document.info = document.info || {}
    document.info.title = cfg.title ? humanize(cfg.title) : (document.info.title || defaultTitle)
    document.info.version = cfg.version || (document.info.version || defaultVersion)
    document.info.description = cfg.description || (document.info.description || defaultDescription)
  } catch {}

  const sectionToEntityName: Record<string, string> = {}
  const sectionToSelectionField: Record<string, string> = {}
  const capitalize = (s: string) => (s && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  for (const [sectionKey, cfg] of Object.entries(sections)) {
    const ent = (cfg as any)?.model
    if (!ent) continue
    const rawTitle = (cfg as any)?.title || ent.name || 'Entity'
    const name = capitalize(String(rawTitle))
    sectionToEntityName[sectionKey] = name
    const selectionField = (cfg as any)?.recordSelectionField || 'id'
    sectionToSelectionField[sectionKey] = selectionField
    // Register main entity schema
    const schema = generateOpenApiSchemaFromEntity(ent)
    if (schema) {
      ;(schema as any).title = name
      if ((cfg as any)?.description) (schema as any).description = (cfg as any).description
      else if (!(schema as any).description) (schema as any).description = `CRUD options for ${name}`
      document.components.schemas[name] = schema
    }
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
  const singularize = (word: string) => {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
    if (word.endsWith('s')) return word.slice(0, -1)
    return word
  }
  const sectionKeys = Object.keys(sections)
  const sectionKeyToSingular: Record<string, string> = Object.fromEntries(sectionKeys.map(k => [k, singularize(k)]))
  const getSectionFromPath = (p: string): string | null => {
    const parts = p.split('/').filter(Boolean)
    if (!parts.length) return null
    // Prefer any segment that matches a known section key
    for (const seg of parts) {
      if (sectionKeys.includes(seg)) return seg
    }
    // Fallback: match singular segment to a section
    for (const seg of parts) {
      const match = sectionKeys.find(k => sectionKeyToSingular[k] === seg)
      if (match) return match
    }
    // Last non-parameter fallback
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

    // List: GET without id param (also detect custom routes like /company/details/{id} using singular)
    if (item.get && !isDetailsPath(path)) {
      item.get.responses = item.get.responses || {}
      item.get.responses['200'] = item.get.responses['200'] || {}
      const regList = CrudmanRegistry.get(); const allowedList = regList.getExportContentTypes();
      const listContent: any = { 'application/json': { schema: buildListEnvelopeSchema(ref) } }
      if (allowedList.includes('csv' as any)) listContent['text/csv'] = { schema: { type: 'string', description: 'CSV of data array. Pagination meta in headers.' } }
      if (allowedList.includes('excel' as any)) listContent['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = { schema: { type: 'string', format: 'binary', description: 'Excel (.xlsx) of data array. Pagination meta in headers.' } }
      item.get.responses['200'].content = listContent

      // Inject query params: pagination, sorting, filters, keyword
      const sectionKey = section as string
      const sectionCfg: any = (sections as any)[sectionKey] || {}
      const listCfg: any = { ...(sectionCfg || {}), ...(sectionCfg.list || {}) }
      const qn = listCfg.queryParamNames || {}
      const pageName = qn.page || 'page'
      const perPageName = qn.perPage || 'perPage'
      const paginateName = qn.paginate || 'paginate'
      const sortPrefix = qn.sortPrefix || 'sort.'
      const keywordName = (qn.keyword || listCfg.keywordParamName || 'keyword')
      const ds = CrudmanRegistry.get().getDataSource?.()
      const meta = ds ? safeGetMetadata(ds, (sectionCfg as any).model) : null
      const allCols: Array<{ name: string; type: string }> = Array.isArray(meta?.columns)
        ? meta!.columns.map((c: any) => ({ name: c.propertyName, type: normalizeType(c.type) }))
        : []
      const filtersWhitelist: string[] = Array.isArray(listCfg.filtersWhitelist) && listCfg.filtersWhitelist.length ? listCfg.filtersWhitelist : allCols.map(c => c.name)
      const sortingWhitelist: string[] = Array.isArray(listCfg.sortingWhitelist) && listCfg.sortingWhitelist.length ? listCfg.sortingWhitelist : allCols.map(c => c.name)

      const params: any[] = item.get.parameters || []
      const pushParam = (p: any) => {
        if (!params.some((e) => e.in === p.in && e.name === p.name)) params.push(p)
      }
      // Pagination
      pushParam({ in: 'query', name: pageName, required: false, schema: { type: 'integer', minimum: 1 } })
      pushParam({ in: 'query', name: perPageName, required: false, schema: { type: 'integer', minimum: 0 } })
      pushParam({ in: 'query', name: paginateName, required: false, schema: { type: 'string', enum: ['true','false','0','1','yes','no'] } })
      // Sorting
      for (const f of sortingWhitelist) {
        pushParam({ in: 'query', name: `${sortPrefix}${f}`, required: false, schema: { type: 'string', enum: ['asc','desc'] } })
      }
      // Filters
      const colType: Record<string, string> = Object.fromEntries(allCols.map(c => [c.name, c.type]))
      const opNames = { min: qn.minOp || 'min', max: qn.maxOp || 'max', gt: qn.gtOp || 'gt', lt: qn.ltOp || 'lt', between: qn.betweenOp || 'between', like: qn.likeOp || 'like' }
      for (const f of filtersWhitelist) {
        const baseType = colType[f] === 'number' || colType[f] === 'integer' ? 'number' : (colType[f] === 'boolean' ? 'boolean' : 'string')
        pushParam({ in: 'query', name: f, required: false, schema: { type: baseType } })
        pushParam({ in: 'query', name: `${f}.${opNames.like}`, required: false, schema: { type: 'string' } })
        pushParam({ in: 'query', name: `${f}.${opNames.min}`, required: false, schema: { type: baseType } })
        pushParam({ in: 'query', name: `${f}.${opNames.max}`, required: false, schema: { type: baseType } })
        pushParam({ in: 'query', name: `${f}.${opNames.gt}`, required: false, schema: { type: baseType } })
        pushParam({ in: 'query', name: `${f}.${opNames.lt}`, required: false, schema: { type: baseType } })
        pushParam({ in: 'query', name: `${f}.${opNames.between}`, required: false, schema: { type: 'string' }, description: 'start,end' })
      }
      // Keyword search
      const kwCfg = listCfg.keyword || {}
      const kwEnabled = kwCfg.isEnabled !== false
      if (kwEnabled) pushParam({ in: 'query', name: keywordName, required: false, schema: { type: 'string' } })
      // x-content-type header (respect configured allowed types)
      const reg = CrudmanRegistry.get()
      const allowed = reg.getExportContentTypes()
      pushParam({ in: 'header', name: 'x-content-type', required: false, description: 'Response content type (default json). Aliases: xlsx→excel', schema: { type: 'string', enum: allowed, default: 'json' } })
      item.get.parameters = params
    }
    // Details: ensure param name matches selectionField and add param definition
    if (item.get && isDetailsPath(path)) {
      item.get.responses = item.get.responses || {}
      item.get.responses['200'] = item.get.responses['200'] || {}
      const regDet = CrudmanRegistry.get(); const allowedDet = regDet.getExportContentTypes();
      const detContent: any = { 'application/json': { schema: buildDetailEnvelopeSchema(ref) } }
      if (allowedDet.includes('csv' as any)) detContent['text/csv'] = { schema: { type: 'string', description: 'CSV single row' } }
      if (allowedDet.includes('excel' as any)) detContent['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] = { schema: { type: 'string', format: 'binary', description: 'Excel (.xlsx) single row' } }
      item.get.responses['200'].content = detContent
      // x-content-type header for details
      const paramsD: any[] = item.get.parameters || []
      if (!paramsD.some((p) => p.in === 'header' && p.name === 'x-content-type')) {
        const reg = CrudmanRegistry.get()
        const allowed = reg.getExportContentTypes()
        paramsD.push({ in: 'header', name: 'x-content-type', required: false, description: 'Response content type (default json)', schema: { type: 'string', enum: allowed, default: 'json' } })
      }
      item.get.parameters = paramsD
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
      // Indicate multipart support for uploads
      item.patch.requestBody = item.patch.requestBody || {
        required: false,
        content: {
          'multipart/form-data': {
            schema: { type: 'object' }
          },
          'application/json': {
            schema: { $ref: `#/components/schemas/${entityName}` }
          }
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
      item.put.requestBody = item.put.requestBody || {
        required: false,
        content: {
          'multipart/form-data': {
            schema: { type: 'object' }
          },
          'application/json': {
            schema: { $ref: `#/components/schemas/${entityName}` }
          }
        }
      }
      item.put.parameters = item.put.parameters || []
      const hasParam = (item.put.parameters as any[]).some((p) => p.name === selectionField)
      if (!hasParam) (item.put.parameters as any[]).push({ in: 'path', name: selectionField, required: true, schema: { type: 'string' } })
    }
    if (item.post) {
      item.post.responses = item.post.responses || {}
      item.post.responses['200'] = item.post.responses['200'] || {}
      item.post.responses['200'].content = {
        'application/json': {
          schema: buildDetailEnvelopeSchema(ref)
        }
      }
      // Add multipart requestBody hint for create with uploads
      item.post.requestBody = item.post.requestBody || {
        required: false,
        content: {
          'multipart/form-data': {
            schema: { type: 'object' }
          },
          'application/json': {
            schema: { $ref: `#/components/schemas/${entityName}` }
          }
        }
      }
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

  // Capitalize tag names globally and update path item tags
  if (Array.isArray(document.tags)) {
    document.tags = document.tags.map((t: any) => ({ ...t, name: capitalize(String(t?.name || '')) }))
  }
  for (const [, item] of Object.entries<any>(document.paths || {})) {
    for (const method of ['get','post','put','patch','delete']) {
      if (item[method] && Array.isArray(item[method].tags)) {
        item[method].tags = item[method].tags.map((n: any) => capitalize(String(n)))
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
      extra: { type: 'object', additionalProperties: true },
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
      success: { type: 'boolean' },
      extra: { type: 'object', additionalProperties: true }
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
      success: { type: 'boolean' },
      extra: { type: 'object', additionalProperties: true }
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


