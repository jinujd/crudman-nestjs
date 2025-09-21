import { CrudmanRegistry } from '../module/CrudmanRegistry'

export function generateOpenApiSchemaFromEntity(entity: any): any | null {
  try {
    const ds = CrudmanRegistry.get().getDataSource?.()
    if (!ds || !entity) return null
    const meta = safeGetMetadata(ds, entity)
    if (!meta) return null
    const properties: Record<string, any> = {}
    const required: string[] = []
    // Determine section-level uniqueness config by scanning global sections for this model
    const globalMeta = (global as any).__crudman_global_meta || { config: { sections: {} } }
    const sections: Record<string, any> = globalMeta.config?.sections || {}
    const uniquenessMap: Record<string, boolean> = {}
    try {
      for (const [, cfg] of Object.entries(sections)) {
        if ((cfg as any)?.model === entity) {
          const gather = (a: any) => Array.isArray(a?.fieldsForUniquenessValidation) ? a.fieldsForUniquenessValidation : []
          const fields = new Set<string>([...gather(cfg), ...gather((cfg as any).create), ...gather((cfg as any).update), ...gather((cfg as any).save)])
          for (const f of fields) uniquenessMap[f] = true
        }
      }
    } catch {}
    for (const col of meta.columns) {
      const name = col.propertyName
      const typ = normalizeType(col.type)
      const prop: any = { type: typ }
      if (col.length) prop.maxLength = Number(col.length)
      if (typ === 'integer' || typ === 'number') {}
      if (typ === 'string' && (String(col.type).toLowerCase().includes('date') || col.isCreateDate || col.isUpdateDate)) {
        prop.type = 'string'; prop.format = 'date-time'
      }
      if (uniquenessMap[name]) {
        prop.description = prop.description ? `${prop.description} | Should be unique` : 'Should be unique'
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
    let entityName = section ? sectionToEntityName[section] : undefined
    const selectionField = section ? sectionToSelectionField[section] || 'id' : 'id'
    // Fallback: infer entity name from path segment when registry sections are unavailable
    if (!entityName && section) {
      const guess = capitalize(singularize(section))
      if (guess && document.components?.schemas?.[guess]) entityName = guess
    }
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
      {
        const sectionKey = section as string
        const sectionCfg: any = (sections as any)[sectionKey] || {}
        let mpSchema = buildCombinedMultipartSchema(document, entityName, sectionKey, sectionCfg, 'update')
        item.patch.requestBody = item.patch.requestBody || { required: false, content: {} }
        const content = item.patch.requestBody.content as any
        if (mpSchema) {
          const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('multipart' as any)) {
            content['multipart/form-data'] = content['multipart/form-data'] || { schema: { type: 'object' } }
            content['multipart/form-data'].schema = stripRelationPropsFromSchema(mpSchema, document, entityName, (sections as any)[sectionKey])
          }
        }
        const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('json' as any)) {
          const existing = content['application/json']?.schema
          const shouldOverride = !existing || isGenericObjectSchema(existing)
          if (shouldOverride) {
            const mode = (CrudmanRegistry.get().getOptions() as any)?.swagger?.requestBodySchemaMode || 'inline'
            if (mode === 'ref') {
              content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
            } else {
              const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'update')
              if (inline) content['application/json'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
              else content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
            }
          }
        }
        if (allow.includes('form' as any)) {
          const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'update')
          if (inline) content['application/x-www-form-urlencoded'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
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
      {
        const sectionKey = section as string
        const sectionCfg: any = (sections as any)[sectionKey] || {}
        let mpSchema = buildCombinedMultipartSchema(document, entityName, sectionKey, sectionCfg, 'update')
        item.put.requestBody = item.put.requestBody || { required: false, content: {} }
        const content = item.put.requestBody.content as any
        if (mpSchema) {
          const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('multipart' as any)) {
            content['multipart/form-data'] = content['multipart/form-data'] || { schema: { type: 'object' } }
            content['multipart/form-data'].schema = stripRelationPropsFromSchema(mpSchema, document, entityName, (sections as any)[sectionKey])
          }
        }
        {
          const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('json' as any)) {
            const existing = content['application/json']?.schema
            const shouldOverride = !existing || isGenericObjectSchema(existing)
            if (shouldOverride) {
              const mode = (CrudmanRegistry.get().getOptions() as any)?.swagger?.requestBodySchemaMode || 'inline'
              if (mode === 'ref') {
                content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
              } else {
                const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'update')
                if (inline) content['application/json'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
                else content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
              }
            }
          }
          if (allow.includes('form' as any)) {
            const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'update')
            if (inline) content['application/x-www-form-urlencoded'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
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
      {
        const sectionKey = section as string
        const sectionCfg: any = (sections as any)[sectionKey] || {}
        let mpSchema = buildCombinedMultipartSchema(document, entityName, sectionKey, sectionCfg, 'create')
        item.post.requestBody = item.post.requestBody || { required: false, content: {} }
        const content = item.post.requestBody.content as any
        if (mpSchema) {
          const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('multipart' as any)) {
            content['multipart/form-data'] = content['multipart/form-data'] || { schema: { type: 'object' } }
            content['multipart/form-data'].schema = stripRelationPropsFromSchema(mpSchema, document, entityName, (sections as any)[sectionKey])
          }
        }
        {
          const allow = CrudmanRegistry.get().getSwaggerRequestBodyContentTypes()
          if (allow.includes('json' as any)) {
            const existing = content['application/json']?.schema
            const shouldOverride = !existing || isGenericObjectSchema(existing)
            if (shouldOverride) {
              const mode = (CrudmanRegistry.get().getOptions() as any)?.swagger?.requestBodySchemaMode || 'inline'
              if (mode === 'ref') {
                content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
              } else {
                const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'create')
                if (inline) content['application/json'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
                else content['application/json'] = { schema: { $ref: `#/components/schemas/${entityName}` } }
              }
            }
          }
          if (allow.includes('form' as any)) {
            const inline = buildInlineJsonSchema(document, entityName, (sections as any)[sectionKey], 'create')
            if (inline) content['application/x-www-form-urlencoded'] = { schema: stripRelationPropsFromSchema(inline, document, entityName, (sections as any)[sectionKey]) }
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
      meta: { type: 'object', additionalProperties: true },
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
      meta: { type: 'object', additionalProperties: true }
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
      meta: { type: 'object', additionalProperties: true }
    }
  }
}

function buildMultipartUploadSchema(sectionKey: string, sectionCfg: any) {
  try {
    // Prefer explicit upload config if present, otherwise expand shorthand
    const uploadCfg = (sectionCfg && sectionCfg.upload) || expandUploadableShorthandSafe(sectionCfg)
    if (!uploadCfg || !Array.isArray(uploadCfg.map) || !uploadCfg.map.length) return null
    const properties: Record<string, any> = {}
    const required: string[] = []
    for (const rule of uploadCfg.map) {
      const field = String(rule.sourceField)
      const isArray = !!rule.isArray
      // In multipart, files use type: string + format: binary per OpenAPI
      const fileSchema: any = { type: 'string', format: 'binary' }
      // Add validation notes to schema description
      const v = computeEffectiveUploadValidators(rule, sectionCfg)
      const parts: string[] = []
      if (Array.isArray(v.allowedMimeTypes) && v.allowedMimeTypes.length) parts.push(`MIME: ${v.allowedMimeTypes.join(', ')}`)
      if (Array.isArray(v.allowedExtensions) && v.allowedExtensions.length) parts.push(`Ext: ${v.allowedExtensions.join(', ')}`)
      if (v.maxSizeMB) parts.push(`Max: ${v.maxSizeMB} MB`)
      const th = (rule as any).typeHint || ''
      if (String(th).includes('avatar')) parts.push('Dimensions: min 128x128, max 4096x4096, aspect ~1:1')
      if (parts.length) fileSchema.description = parts.join(' | ')
      properties[field] = isArray ? { type: 'array', items: fileSchema } : fileSchema
      // Only mark required if validators explicitly require; keep optional by default
    }
    return { type: 'object', properties, required: required.length ? required : undefined }
  } catch {
    return null
  }
}

function expandUploadableShorthandSafe(sectionCfg: any): any | undefined {
  try {
    const uploadable = sectionCfg?.uploadable
    if (!uploadable || typeof uploadable !== 'object') return sectionCfg?.upload
    const defaults = sectionCfg?.uploadDefaults || {}
    const out: any = { sources: ['multipart'], map: [] }
    for (const [field, hint] of Object.entries<any>(uploadable)) {
      const isArray = Array.isArray(hint)
      const typeHint = (isArray ? hint[0] : hint) as any
      const storageMode = defaults.storageMode || 'filename'
      const targetField = storageMode === 'filename'
        ? (isArray ? { keys: `${field}Keys`, urls: `${field}Urls` } : { key: `${field}Key`, url: `${field}Url` })
        : (storageMode === 'blob' ? { blob: `${field}Blob`, mime: `${field}Mime` } : `${field}`)
      out.map.push({
        sourceField: field,
        targetField,
        isArray,
        storageMode,
        storage: defaults.storage,
        sources: ['multipart', 'base64'],
        typeHint: typeof typeHint === 'string' ? typeHint : undefined
      })
    }
    return out
  } catch { return undefined }
}

// Build a multipart schema that includes both file fields (binary) and regular entity fields (string/number/etc.)
function buildCombinedMultipartSchema(document: any, entityName: string, sectionKey: string, sectionCfg: any, mode: 'create' | 'update' = 'create'): any | null {
  const fileSchema = buildMultipartUploadSchema(sectionKey, sectionCfg)
  const entityRef = document?.components?.schemas?.[entityName]
  if (!fileSchema && !entityRef) return null
  // Merge properties: file fields override by name to ensure binary input
  const properties: Record<string, any> = {}
  // Derive readonly fields from ORM metadata (primary, generated, timestamps)
  const readonlyFields = new Set<string>()
  try {
    const ds = CrudmanRegistry.get().getDataSource?.()
    const meta = ds ? safeGetMetadata(ds, (sectionCfg as any).model) : null
    for (const col of meta?.columns || []) {
      if (col.isPrimary || col.isGenerated || col.isCreateDate || col.isUpdateDate) readonlyFields.add(col.propertyName)
    }
    // Also exclude upload target fields (e.g., avatarKey, avatarUrl)
    const uploadCfg = (sectionCfg && sectionCfg.upload) || expandUploadableShorthandSafe(sectionCfg)
    if (uploadCfg && Array.isArray(uploadCfg.map)) {
      for (const rule of uploadCfg.map) {
        const tf = rule?.targetField
        if (typeof tf === 'string') readonlyFields.add(tf)
        else if (tf && typeof tf === 'object') {
          for (const v of Object.values(tf)) if (typeof v === 'string') readonlyFields.add(v)
        }
      }
    }
  } catch {}
  if (entityRef && entityRef.properties && typeof entityRef.properties === 'object') {
    const relationNames = getRelationFieldNames(document, entityName, sectionCfg)
    for (const [name, prop] of Object.entries<any>(entityRef.properties)) {
      const n = String(name)
      if (readonlyFields.has(n)) continue
      // Exclude relations from write multipart fields by default
      try {
        const includeRelations = CrudmanRegistry.get().getIncludeRelationsInWriteBody()
        const looksLikeRelation = !!(prop && (prop.$ref || (prop.items && (prop.items as any).$ref) || prop.type === 'object' || (prop.type === 'array' && (prop.items && (prop.items as any).type === 'object'))))
        if (!includeRelations && (relationNames.has(n) || looksLikeRelation)) continue
      } catch {}
      if (!isWritableScalarProperty(prop)) continue
      // Swagger UI needs primitive types for multipart; map object/array to string by default
      const base = mapToMultipartFriendly(prop)
      // preserve description (e.g., unique labels)
      if (prop && prop.description) base.description = prop.description
      properties[n] = base
    }
  }
  if (fileSchema && fileSchema.properties) {
    for (const [name, prop] of Object.entries<any>(fileSchema.properties)) {
      properties[name] = prop
    }
  }
  return { type: 'object', properties }
}

function mapToMultipartFriendly(prop: any): any {
  const t = (prop && prop.type) || 'string'
  if (prop && prop.format === 'date-time') return { type: 'string', format: 'date-time' }
  if (t === 'string' || t === 'number' || t === 'integer' || t === 'boolean') return { type: t }
  // For arrays/objects/refs, default to string (client can send JSON string)
  return { type: 'string' }
}

function isWritableScalarProperty(prop: any): boolean {
  try {
    if (!prop || typeof prop !== 'object') return false
    if (prop.$ref) return false
    const t = prop.type
    if (t === 'string' || t === 'number' || t === 'integer' || t === 'boolean') return true
    if (prop.format === 'date-time') return true
    if (t === 'array') {
      const items = prop.items || {}
      if ((items as any).$ref) return false
      const it = (items as any).type
      return it === 'string' || it === 'number' || it === 'integer' || it === 'boolean'
    }
    return false
  } catch { return false }
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

// Build inline JSON schema (entity properties with readonly fields removed). For update, make all fields optional.
function buildInlineJsonSchema(document: any, entityName: string, sectionCfg: any, mode: 'create' | 'update'): any | null {
  try {
    let comp = document?.components?.schemas?.[entityName]
    if (!comp || typeof comp !== 'object' || !comp.properties) {
      // Fallback: derive from ORM metadata directly
      const derived = generateOpenApiSchemaFromEntity((sectionCfg as any)?.model)
      if (!derived) return null
      comp = derived
    }
    const properties: Record<string, any> = {}
    const required: string[] = []
    // Determine readonly fields using ORM metadata and upload targets like in multipart
    const readonlyFields = new Set<string>()
    const relationFields = new Set<string>()
    try {
      const ds = CrudmanRegistry.get().getDataSource?.()
      const meta = ds ? safeGetMetadata(ds, (sectionCfg as any)?.model) : null
      for (const col of meta?.columns || []) {
        if (col.isPrimary || col.isGenerated || col.isCreateDate || col.isUpdateDate) readonlyFields.add(col.propertyName)
      }
      for (const rel of meta?.relations || []) {
        relationFields.add(rel.propertyName)
      }
      const uploadCfg = (sectionCfg && sectionCfg.upload) || expandUploadableShorthandSafe(sectionCfg)
      if (uploadCfg && Array.isArray(uploadCfg.map)) {
        for (const rule of uploadCfg.map) {
          const tf = rule?.targetField
          if (typeof tf === 'string') readonlyFields.add(tf)
          else if (tf && typeof tf === 'object') {
            for (const v of Object.values(tf)) if (typeof v === 'string') readonlyFields.add(v as string)
          }
        }
      }
    } catch {}
    const relationNames = getRelationFieldNames(document, entityName, sectionCfg)
    for (const [name, prop] of Object.entries<any>(comp.properties)) {
      const n = String(name)
      if (readonlyFields.has(n)) continue
      const includeRelations = CrudmanRegistry.get().getIncludeRelationsInWriteBody()
      const looksLikeRelation = !!(prop && (prop.$ref || (prop.items && (prop.items as any).$ref)))
      if (!includeRelations && (relationFields.has(n) || relationNames.has(n) || looksLikeRelation)) continue
      if (!isWritableScalarProperty(prop)) continue
      properties[name] = prop
    }
    if (mode === 'create') {
      const baseReq = Array.isArray((comp as any).required) ? (comp as any).required : []
      for (const r of baseReq) if (!readonlyFields.has(String(r)) && properties[r]) required.push(String(r))
    }
    return { type: 'object', properties, required: required.length ? required : undefined }
  } catch { return null }
}

function isGenericObjectSchema(schema: any): boolean {
  try {
    if (!schema || typeof schema !== 'object') return false
    if (schema.$ref) return false
    const t = schema.type
    const hasProps = !!schema.properties || !!schema.items
    return t === 'object' && !hasProps
  } catch { return false }
}

// Collect relation field names from ORM metadata and from component schema refs
function getRelationFieldNames(document: any, entityName: string, sectionCfg: any): Set<string> {
  const out = new Set<string>()
  try {
    const ds = CrudmanRegistry.get().getDataSource?.()
    const meta = ds ? safeGetMetadata(ds, (sectionCfg as any)?.model) : null
    for (const rel of meta?.relations || []) out.add(String(rel.propertyName))
  } catch {}
  try {
    const comp = document?.components?.schemas?.[entityName]
    for (const [k, v] of Object.entries<any>(comp?.properties || {})) {
      if (!v) continue
      if (v.$ref) out.add(String(k))
      else if (v.type === 'array' && v.items && (v.items as any).$ref) out.add(String(k))
      else if (v.type === 'object' && !v.properties) out.add(String(k))
    }
  } catch {}
  return out
}

// Remove relation-like properties from a schema object (does not mutate original)
function stripRelationPropsFromSchema(schema: any, document: any, entityName: string, sectionCfg: any): any {
  try {
    const include = CrudmanRegistry.get().getIncludeRelationsInWriteBody()
    if (include) return schema
    const rels = getRelationFieldNames(document, entityName, sectionCfg)
    const copy = JSON.parse(JSON.stringify(schema))
    const props = (copy && copy.properties && typeof copy.properties === 'object') ? copy.properties : null
    if (!props) return copy
    for (const [k, v] of Object.entries<any>(props)) {
      const looksLikeRelation = !!(v && (v.$ref || (v.type === 'array' && v.items && (v.items as any).$ref) || v.type === 'object'))
      if (rels.has(String(k)) || looksLikeRelation) delete (props as any)[k]
    }
    if (Array.isArray(copy.required)) copy.required = copy.required.filter((r: any) => !!props[r])
    return copy
  } catch { return schema }
}

function computeEffectiveUploadValidators(rule: any, sectionCfg: any): any {
  try {
    const reg = CrudmanRegistry.get()
    const globalLimits = reg.getUploadLimits() || {}
    const typeDefaults = getTypeHintDefaults(String(rule?.typeHint || ''))
    const sectionDefaults = (sectionCfg?.uploadDefaults?.validators) || {}
    return { ...typeDefaults, ...globalLimits, ...sectionDefaults, ...(rule.validators || {}) }
  } catch { return rule?.validators || {} }
}

function getTypeHintDefaults(typeHint: string): any {
  const map: Record<string, any> = {
    'image': { allowedMimeTypes: ['image/jpeg','image/png','image/gif','image/webp','image/avif'], allowedExtensions: ['.jpg','.jpeg','.png','.gif','.webp','.avif'], maxSizeMB: 5 },
    'image-jpg': { allowedMimeTypes: ['image/jpeg'], allowedExtensions: ['.jpg','.jpeg'], maxSizeMB: 5 },
    'image-png': { allowedMimeTypes: ['image/png'], allowedExtensions: ['.png'], maxSizeMB: 5 },
    'image-gif': { allowedMimeTypes: ['image/gif'], allowedExtensions: ['.gif'], maxSizeMB: 5 },
    'image-webp': { allowedMimeTypes: ['image/webp'], allowedExtensions: ['.webp'], maxSizeMB: 5 },
    'image-avif': { allowedMimeTypes: ['image/avif'], allowedExtensions: ['.avif'], maxSizeMB: 5 },
    'image-avatar': { allowedMimeTypes: ['image/jpeg','image/png','image/gif','image/webp','image/avif'], allowedExtensions: ['.jpg','.jpeg','.png','.gif','.webp','.avif'], maxSizeMB: 2 },
    'image-jpg-avatar': { allowedMimeTypes: ['image/jpeg'], allowedExtensions: ['.jpg','.jpeg'], maxSizeMB: 2 },
    'image-png-avatar': { allowedMimeTypes: ['image/png'], allowedExtensions: ['.png'], maxSizeMB: 2 },
    'image-webp-avatar': { allowedMimeTypes: ['image/webp'], allowedExtensions: ['.webp'], maxSizeMB: 2 },
    'image-avif-avatar': { allowedMimeTypes: ['image/avif'], allowedExtensions: ['.avif'], maxSizeMB: 2 },
    'video': { allowedMimeTypes: ['video/mp4','video/webm','video/ogg'], allowedExtensions: ['.mp4','.webm','.ogg'], maxSizeMB: 100 },
    'video-mp4': { allowedMimeTypes: ['video/mp4'], allowedExtensions: ['.mp4'], maxSizeMB: 100 },
    'video-webm': { allowedMimeTypes: ['video/webm'], allowedExtensions: ['.webm'], maxSizeMB: 100 },
    'video-ogg': { allowedMimeTypes: ['video/ogg'], allowedExtensions: ['.ogg'], maxSizeMB: 100 },
    'video-short': { allowedMimeTypes: ['video/mp4','video/webm'], allowedExtensions: ['.mp4','.webm'], maxSizeMB: 25 },
    'audio': { allowedMimeTypes: ['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav'], allowedExtensions: ['.mp3','.m4a','.aac','.ogg','.wav'], maxSizeMB: 20 },
    'pdf': { allowedExtensions: ['.pdf'], maxSizeMB: 10 },
    'doc': { allowedExtensions: ['.pdf','.doc','.docx','.odt'], maxSizeMB: 10 },
    'spreadsheet': { allowedExtensions: ['.xls','.xlsx','.csv'], maxSizeMB: 10 },
    'spreadsheet-csv': { allowedMimeTypes: ['text/csv'], allowedExtensions: ['.csv'], maxSizeMB: 5 },
    'spreadsheet-xls': { allowedMimeTypes: ['application/vnd.ms-excel'], allowedExtensions: ['.xls'], maxSizeMB: 10 },
    'spreadsheet-xlsx': { allowedMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], allowedExtensions: ['.xlsx'], maxSizeMB: 10 },
    'text': { allowedMimeTypes: ['text/plain','text/markdown'], allowedExtensions: ['.txt','.md'], maxSizeMB: 2 },
    'csv': { allowedMimeTypes: ['text/csv'], allowedExtensions: ['.csv'], maxSizeMB: 5 },
    'xml': { allowedMimeTypes: ['application/xml','text/xml'], allowedExtensions: ['.xml'], maxSizeMB: 2 },
    'html': { allowedMimeTypes: ['text/html'], allowedExtensions: ['.html','.htm'], maxSizeMB: 2 },
    'json': { allowedMimeTypes: ['application/json'], allowedExtensions: ['.json'], maxSizeMB: 2 },
    'archive': { allowedExtensions: ['.zip','.tar','.gz','.rar','.7z'], maxSizeMB: 200 },
    'binary': { allowedMimeTypes: ['application/octet-stream'], maxSizeMB: 50 },
    'any': {}
  }
  return map[typeHint] || {}
}


