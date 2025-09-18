import { describe, it, expect } from 'vitest'
import { TypeormAdapter } from '../src/lib/adapters/typeorm.adapter'

function makeRepo(items: any[]) {
  return {
    findAndCount: async ({ where, skip, take, order }: any) => {
      let arr = [...items]
      if (where?.role) arr = arr.filter(x => x.role === where.role)
      if (order && order.createdAt) arr.sort((a,b)=> order.createdAt==='DESC'? (b.createdAt-a.createdAt) : (a.createdAt-b.createdAt))
      const total = arr.length
      arr = arr.slice(skip, skip + take)
      return [arr, total]
    },
    findOne: async ({ where }: any) => items.find(x => x.id === where.id) || null,
    create: (obj: any) => obj,
    save: async (obj: any) => ({ ...obj, id: obj.id ?? 999 }),
    update: async (_where: any, obj: any) => ({ affected: 1, obj }),
    delete: async (_where: any) => ({ affected: 1 }),
    count: async ({ where }: any) => items.filter(x => !where || Object.keys(where).every(k => x[k]===where[k])).length
  }
}

describe('TypeormAdapter', () => {
  const repo = makeRepo([
    { id: 1, email: 'a@b.com', role: 'admin', createdAt: 2 },
    { id: 2, email: 'c@d.com', role: 'user', createdAt: 3 }
  ])
  const cfg = { additionalSettings: { repo }, model: {} }

  it('lists with pagination and sorting', async () => {
    const req: any = { query: { page: '1', per_page: '1', 'sort.createdAt': 'desc', role: 'admin' } }
    const out = await TypeormAdapter.list(req, cfg as any)
    expect(out.items.length).toBe(1)
    expect(out.pagination.totalItemsCount).toBe(1)
  })

  it('details by id', async () => {
    const req: any = { params: { id: 2 } }
    const out = await TypeormAdapter.details(req, cfg as any)
    expect(out?.id).toBe(2)
  })

  it('create/update/delete', async () => {
    const created = await TypeormAdapter.create({ body: { email: 'z@z.com' } } as any, cfg as any)
    expect(created.id).toBeDefined()
    const updated = await TypeormAdapter.update({ params: { id: 1 }, body: { email: 'x@x.com' } } as any, cfg as any)
    expect(updated.id).toBe(1)
    await TypeormAdapter.delete({ params: { id: 1 } } as any, cfg as any)
  })
})


