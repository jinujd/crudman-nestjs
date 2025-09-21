import { Company } from '../company.entity'

export function companiesSection() {
  return {
    model: Company,
    // Demonstrate uniqueness on company name
    create: {
      fieldsForUniquenessValidation: ['name'],
      getAdditionalResponse: async (_req: any) => ({ createdVia: 'companies-section' })
    },
    update: {
      fieldsForUniquenessValidation: ['name']
    },
    list: {
      additionalResponse: { servedBy: 'example-app' },
      getAdditionalResponse: async (req: any) => ({ requestId: req.headers?.['x-request-id'] || null })
    }
  }
}
