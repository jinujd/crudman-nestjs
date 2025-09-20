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

  it('POST /api/profiles should return validation errors for invalid base64 avatar (mime/ext)', async () => {
    const dataUrl = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQAB9S4nWQAAAABJRU5ErkJggg=='
    const res = await request(app.getHttpServer())
      .post('/api/profiles')
      .send({ name: 'John Upload', avatar: dataUrl })
      .expect((r) => [200,201].includes(r.status))

    expect(res.body.success).toBe(false)
    const msg = JSON.stringify(res.body.errors || [])
    expect(msg).toMatch(/Invalid (extension|MIME) type|fileMime|fileExtension/i)
  })
})


