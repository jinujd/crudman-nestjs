import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UseCrud, CrudControllerBase, getCrudmanDataSource } from 'crudman-nestjs'
import { AuditLog } from './audit-log.entity'
import { Company } from './company.entity'
import { DataSource } from 'typeorm'

class FlagService { get() { return 'ok' } }

export function ctxDemoSection() {
  return {
    model: Company,
    additionalSettings: {
      // Provide repo lazily via function so adapter can evaluate per-request
      repo: (_cfg: any, ctx: any) => {
        const ds = ctx?.dataSource || getCrudmanDataSource()
        return ds ? ds.getRepository(Company) : undefined
      }
    },
    // Smart context as function: returns services, repositories, and custom keys
    context: async (req: any, _res: any, _cfg: any, moduleRef: any) => {
      const flags = new FlagService()
      let ds = getCrudmanDataSource()
      try {
        const maybe = moduleRef && (moduleRef.get('DataSource', { strict: false }) || moduleRef.get(DataSource, { strict: false }))
        if (maybe) ds = maybe

        // console.log(`Data source is`, ds)
        // console.log(`Module ref is`, moduleRef)
      } catch {}
      return {
        services: { flags },
        repositories: ds ? { audit: ds.getRepository(AuditLog), company: ds.getRepository(Company) } : {},
        repository: ds ? ds.getRepository(Company) : undefined,
        dataSource: ds,
        tenantId: req.headers?.['x-tenant-id'] || null
      }
    },

    onAfterAction: async (result: any, req: any, ctx: any) => {
      console.log(`On after is.. executed..`)
      // write an audit row via injected repo
      await ctx.repositories?.audit?.save({ type: 'CTX_LIST', notes: String(req.headers?.['x-tenant-id'] || '') })
      // If a company name is provided, use injected company repository to find it
      const companyName = (req.headers?.['x-company'] || req.headers?.['X-Company']) as string | undefined
      if (companyName && ctx.repositories?.company?.findOne) {
        try {
          const found = await ctx.repositories.company.findOne({ where: { name: String(companyName) } })
          ;(result as any).meta = (result as any).meta || {}
          const prev = (result as any).meta.ctxRepoProbe || {}
          ;(result as any).meta.ctxRepoProbe = { ...prev, companyFoundId: found?.id ?? null }
        } catch {}
      }
      // echo selected ctx into meta for assertions
      result.meta = {
        ...(result.meta || {}),
        ctxProbe: {
          hasService: !!ctx.service,
          hasRepository: !!ctx.repository,
          hasModuleRef: !!ctx.moduleRef,
          hasDataSource: !!ctx.dataSource,
          tenantId: ctx.tenantId,
          entityRepo: ctx.repository?.metadata?.targetName || ctx.repository?.metadata?.name || null,
          flag: ctx.services?.flags?.get?.() || null,
          auxV: (ctx.services?.aux as any)?.v || null,
          fromAction: !!(ctx as any).fromAction,
          reservedSafe: typeof ctx.service === 'object' && !!ctx.moduleRef
        }
      }
      ;(result as any).meta.ctxRepoProbe = {
        ...((result as any).meta?.ctxRepoProbe || {}),
        preCompanyFoundId: (ctx as any).preCompanyFoundId ?? null,
        preQueryCompanyFoundId: (ctx as any).preQueryCompanyFoundId ?? null,
        afterFetchCompanyFoundId: (ctx as any).afterFetchCompanyFoundId ?? null
      }
      return result
    },
    list: {
      context: async () => ({
        services: { flags: { get: () => 'action' }, aux: { v: 2 } },
        service: 'nope',
        moduleRef: 'nope',
        dataSource: undefined,
        fromAction: true
      } as any),
      onBeforeAction: async (req: any, _res: any, ctx: any) => {
        console.log(`On before action`)
        // Ensure repository/dataSource present before adapter
       // console.log(`Context found is`)
        // if (!ctx.moduleRef) ctx.moduleRef = {}
        // if (!ctx.dataSource && ctx.moduleRef) {
        //   try {
        //     const ds = ctx.moduleRef.get('DataSource', { strict: false }) || ctx.moduleRef.get(DataSource, { strict: false }) || getCrudmanDataSource()
        //     console.log(`Data source found`, ds)
        //     if (ds) ctx.dataSource = ds
        //   } catch {
        //     console.log(`Data source not found`)
        //   }
        // } else {
        //   console.log(`Data moduleRef found in context`, ctx.moduleRef)
        // }
        // if (!ctx.repository && ctx.dataSource) {
        //   try { ctx.repository = ctx.dataSource.getRepository(Company) } catch {}
          
        // } else {
        //   // console.log(`Data repository found in context`, ctx.repository)
        //   // console.log( `Data source found in context`, ctx.dataSource)
        // }
        // // Use injected company repository pre-action if header provided
        // const companyName = `Acme Air`
        // console.log(`Company name`, companyName)
        // if (companyName && ctx.repositories?.company?.findOne) {
        //   try {
        //     const found = await ctx.repositories.company.findOne({ where: { name: String(companyName) } })
        //     console.log(`Company found`, found)
        //     ;(ctx as any).preCompanyFoundId = found?.id ?? null
        //   } catch {}
        // }
      },
      onBeforeQuery: async (findOptions: any, _model: any, ctx: any, req: any) => {
        console.log(`On before query`)
        // const companyName = (req?.headers?.['x-company'] || req?.headers?.['X-Company']) as string | undefined
        // if (companyName && ctx.repositories?.company?.findOne) {
        //   try {
        //     const found = await ctx.repositories.company.findOne({ where: { name: String(companyName) } })
        //     ;(ctx as any).preQueryCompanyFoundId = found?.id ?? null
        //   } catch {}
        // }
        return findOptions
      },
      onAfterFetch: async (data: any, req: any, ctx: any) => {
        console.log(`On after fetch`)
        // const companyName = (req?.headers?.['x-company'] || req?.headers?.['X-Company']) as string | undefined
        // if (companyName && ctx.repositories?.company?.findOne) {
        //   try {
        //     const found = await ctx.repositories.company.findOne({ where: { name: String(companyName) } })
        //     ;(ctx as any).afterFetchCompanyFoundId = found?.id ?? null
        //   } catch {}
        // }
        return data
      },
      
    },
    create: {
      // Test uniqueness validation
      fieldsForUniquenessValidation: ['name'],
      getFinalValidationRules: (rules: any, ctx: any, req: any) => {
        req._validationProbe = req._validationProbe || {}
        req._validationProbe.rulesSawCtx = !!ctx.moduleRef
        
        // Test 1: Override existing field with proper type
        // Test 2: Add new field WITHOUT type (should default to 'string')
        // Test 3: Add field with explicit type
        // Test 4: Uncomment the line below to test schema error (500 error)
        // badRule: "not an object"  // This will cause 500 error
        
        return { 
          ...rules,
          // Make name required with min/max constraints
          name: { type: 'string', min: 3, max: 100, optional: false },
          // Test default type behavior - no 'type' specified (will default to 'string')
          isActive: { optional: false },
          // Explicit type specification
          revenue: { type: 'number', min: 0, optional: true }
        }
      },
      onBeforeValidate: async (req: any) => {
        req._validationProbe = req._validationProbe || {}
        req._validationProbe.beforeValidateFlag = true
        return true
      },
      onAfterValidate: async (req: any) => {
        req._validationProbe = req._validationProbe || {}
        req._validationProbe.afterValidateFlag = true
        return true
      },
      onAfterAction: async (result: any, req: any) => {
        result.meta = result.meta || {}
        result.meta.validationCtxProbe = {
          rulesSawCtx: !!req._validationProbe?.rulesSawCtx,
          beforeValidateFlag: !!req._validationProbe?.beforeValidateFlag,
          afterValidateFlag: !!req._validationProbe?.afterValidateFlag
        }
        return result
      }
    }
  }
}

@UseCrud({ sections: { 'ctx-demo': ctxDemoSection() } })
@ApiTags('ctx-demo')
@Controller('api/ctx-demo')
export class CtxDemoController extends CrudControllerBase('ctx-demo') {}


