import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import 'reflect-metadata'
import { INestApplication } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'

describe('ShorthandController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    const ds = app.get(DataSource)
    setCrudmanDataSource(ds)
    // init swagger for /docs-json (after app.init)
    const config = new DocumentBuilder().setTitle('Test').setVersion('1.0').build()
    const doc = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, doc)
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/tags should return list envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/tags').expect(200)
    expect(res.body).toHaveProperty('data')
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('Swagger docs should include tags and categories schemas', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200)
    const paths = res.body.paths || {}
    expect(paths['/api/tags']).toBeTruthy()
    expect(paths['/api/categories']).toBeTruthy()
  })
})


