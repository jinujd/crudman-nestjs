import { Company } from '../company.entity'

export function companiesSection() {
  return {
    model: Company,
    list: {
      additionalResponse: { servedBy: 'example-app' },
      getAdditionalResponse: async (req: any) => ({ requestId: req.headers?.['x-request-id'] || null })
    },
    create: {
      getAdditionalResponse: async (_req: any) => ({ createdVia: 'companies-section' })
    }
  }
}
