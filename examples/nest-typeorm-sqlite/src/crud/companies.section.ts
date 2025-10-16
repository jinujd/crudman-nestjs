import { Company } from '../company.entity'
import { getCrudmanDataSource } from 'crudman-nestjs'

export function companiesSection() {
  return {
    model: Company,
    // Test explicit uniqueness validation on company name
    create: {
      fieldsForUniquenessValidation: ['name'],
      additionalSettings: { 
        repo: (cfg: any, ctx: any) => {
          const ds = ctx?.dataSource || getCrudmanDataSource()
          return ds ? ds.getRepository(Company) : undefined
        }
      },
      getAdditionalResponse: async (_req: any) => ({ createdVia: 'companies-section' })
    },
    update: {
      fieldsForUniquenessValidation: ['name'],
      additionalSettings: { 
        repo: (cfg: any, ctx: any) => {
          const ds = ctx?.dataSource || getCrudmanDataSource()
          return ds ? ds.getRepository(Company) : undefined
        }
      }
    },
    // Test auto-detection of unique constraints (if Company entity has unique fields)
    // This will automatically detect any @Column({ unique: true }) fields
    save: {
      additionalSettings: { 
        repo: (cfg: any, ctx: any) => {
          const ds = ctx?.dataSource || getCrudmanDataSource()
          return ds ? ds.getRepository(Company) : undefined
        }
      }
      // No fieldsForUniquenessValidation specified - will auto-detect from entity metadata
    },
    list: {
      additionalSettings: { 
        repo: (cfg: any, ctx: any) => {
          const ds = ctx?.dataSource || getCrudmanDataSource()
          return ds ? ds.getRepository(Company) : undefined
        }
      },
      additionalResponse: { servedBy: 'example-app' },
      getAdditionalResponse: async (req: any) => ({ requestId: req.headers?.['x-request-id'] || null })
    }
  }
}
