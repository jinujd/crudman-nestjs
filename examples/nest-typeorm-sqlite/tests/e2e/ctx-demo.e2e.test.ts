import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import request from 'supertest'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../src/app.module'
import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { AuditLog } from '../../src/audit-log.entity'
import { setCrudmanDataSource, setCrudmanModuleRef } from 'crudman-nestjs'

describe('Ctx Demo E2E', () => {
  let app: INestApplication
  let httpServer: any
  let ds: DataSource

  beforeAll(async () => {
    app = await NestFactory.create(AppModule)
    await app.init()
    httpServer = app.getHttpServer()
    ds = app.get(DataSource)
    // Ensure library registry has DS for adapter fallback
    setCrudmanDataSource(ds)
    // Ensure moduleRef is available to context builder
    setCrudmanModuleRef(app as any)
  })

  afterAll(async () => {
    await app.close()
  })

  it('list should expose context meta and write audit log', async () => {
    const repo = ds.getRepository(AuditLog)
    const before = await repo.count()

    const res = await request(httpServer)
      .get('/api/ctx-demo')
      .set('x-tenant-id', 't-123')
      .expect(200)

    expect(res.body?.meta?.ctxProbe?.hasService).toBe(true)
    expect(res.body?.meta?.ctxProbe?.hasRepository).toBe(true)
    expect(res.body?.meta?.ctxProbe?.hasModuleRef).toBe(true)
    expect(res.body?.meta?.ctxProbe?.hasDataSource).toBe(true)
    expect(res.body?.meta?.ctxProbe?.tenantId).toBe('t-123')
    expect(res.body?.meta?.ctxProbe?.entityRepo).toBe('Company')
    // action override should replace flags.get()
    expect(res.body?.meta?.ctxProbe?.flag).toBe('action')
    expect(res.body?.meta?.ctxProbe?.auxV).toBe(2)
    expect(res.body?.meta?.ctxProbe?.fromAction).toBe(true)
    expect(res.body?.meta?.ctxProbe?.reservedSafe).toBe(true)

    const after = await repo.count()
    expect(after).toBe(before + 1)
  })

  it('list should use injected company repository to find by name', async () => {
    // create a company with a unique name
    const unique = 'CtxProbe Co'
    await request(httpServer).post('/api/companies').send({ name: unique }).expect((r) => [200,201].includes(r.status))

    const res = await request(httpServer)
      .get('/api/ctx-demo')
      .set('x-company', unique)
      .expect(200)

    expect(res.body?.meta?.ctxRepoProbe?.companyFoundId).toBeTruthy()
    expect(res.body?.meta?.ctxRepoProbe?.preCompanyFoundId).toBeTruthy()
  })

  it('create should pass ctx to validation hooks and expose flags', async () => {
    const name = 'ValProbe Co'
    const res = await request(httpServer)
      .post('/api/ctx-demo')
      .send({ name })
      .expect(201)

    expect(res.body?.meta?.validationCtxProbe?.rulesSawCtx).toBe(true)
    expect(res.body?.meta?.validationCtxProbe?.beforeValidateFlag).toBe(true)
    expect(res.body?.meta?.validationCtxProbe?.afterValidateFlag).toBe(true)
  })
})


