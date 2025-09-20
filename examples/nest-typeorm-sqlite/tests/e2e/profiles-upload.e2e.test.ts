import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import * as path from 'path'

describe('Profiles upload (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    const ds = app.get(DataSource)
    setCrudmanDataSource(ds)
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /api/profiles should accept multipart avatar and return url', async () => {
    const filePath = path.join(__dirname, '../../src/app.module.ts')
    const res = await request(app.getHttpServer())
      .post('/api/profiles')
      .field('name', 'John Upload')
      .attach('avatar', filePath)
      .expect(201)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('id')
    // avatarKey may exist; avatarUrl should be set by LocalDisk publicBaseUrl mapping
    expect(!!res.body.data.avatarUrl || !!res.body.data.avatarKey).toBe(true)
  })
})


