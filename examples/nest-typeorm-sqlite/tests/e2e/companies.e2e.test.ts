import 'reflect-metadata'
import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'
import { Company } from '../../src/company.entity'

let app: INestApplication
let ds: DataSource

async function seed(ds: DataSource) {
  const repo = ds.getRepository(Company)
  await repo.clear()
  await repo.save(repo.create({ name: 'Acme', isActive: true }))
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = moduleRef.createNestApplication()
  await app.init()
  ds = app.get(DataSource)
  setCrudmanDataSource(ds)
  await seed(ds)
})

afterAll(async () => {
  await app?.close()
})

it('GET /api/companies should list items', async () => {
  const res = await request(app.getHttpServer()).get('/api/companies')
  expect(res.status).toBe(200)
  expect(res.body.success).toBe(true)
  expect(Array.isArray(res.body.data)).toBe(true)
  expect(res.body.data.length).toBeGreaterThanOrEqual(1)
})

it('POST /api/companies should create', async () => {
  const res = await request(app.getHttpServer()).post('/api/companies').send({ name: 'Beta Inc' })
  expect([200,201]).toContain(res.status)
  expect(res.body.success).toBe(true)
  expect(res.body.data.id).toBeDefined()
})

it('GET /api/companies?name.like=acme should filter', async () => {
  const res = await request(app.getHttpServer()).get('/api/companies?name.like=acme')
  expect(res.status).toBe(200)
  expect(!!res.body.data.find((x: any) => String(x.name).toLowerCase().includes('acme'))).toBe(true)
})

it('PATCH /api/companies/:id should update', async () => {
  const create = await request(app.getHttpServer()).post('/api/companies').send({ name: 'Gamma' })
  const id = create.body.data.id
  const res = await request(app.getHttpServer()).patch(`/api/companies/${id}`).send({ name: 'Gamma LLC' })
  expect(res.status).toBe(200)
  expect(res.body && res.body.data && res.body.data.name).toBe('Gamma LLC')
})

it('DELETE /api/companies/:id should delete', async () => {
  const create = await request(app.getHttpServer()).post('/api/companies').send({ name: 'Delta' })
  const id = create.body.data.id
  const res = await request(app.getHttpServer()).delete(`/api/companies/${id}`)
  expect(res.status).toBe(200)
})

it('GET /api/companies with x-content-type: excel returns JSON error if exceljs missing', async () => {
  const res = await request(app.getHttpServer()).get('/api/companies').set('x-content-type', 'excel')
  expect(res.status).toBe(200)
  // Should be JSON body with success=false and error message about exceljs
  expect(res.headers['content-type']).toMatch(/application\/json/)
  expect(res.body && typeof res.body === 'object').toBe(true)
  expect(res.body.success).toBe(false)
  const msg = JSON.stringify(res.body.errors || [])
  expect(msg.toLowerCase()).toContain('exceljs')
})

