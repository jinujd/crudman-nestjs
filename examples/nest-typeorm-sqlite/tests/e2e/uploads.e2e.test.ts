import 'reflect-metadata'
import { promises as fs } from 'fs'
import * as path from 'path'
import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'

let app: INestApplication
let ds: DataSource
let tmpDir: string

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true }).catch(() => {})
}

async function writeBase64File(fp: string, base64: string) {
  const buf = Buffer.from(base64, 'base64')
  await fs.writeFile(fp, buf)
  return fp
}

// 1x1 transparent PNG
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQAB9S4nWQAAAABJRU5ErkJggg=='
// Small plain text
const TXT_CONTENT = 'hello world'

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  app = moduleRef.createNestApplication()
  await app.init()
  ds = app.get(DataSource)
  setCrudmanDataSource(ds)
  tmpDir = path.join(process.cwd(), 'examples/nest-typeorm-sqlite/tmp')
  await ensureDir(tmpDir)
})

afterAll(async () => {
  try { await app?.close() } catch {}
})

it('POST /api/uploads-image (multipart) should accept PNG and store filename key', async () => {
  const pngPath = await writeBase64File(path.join(tmpDir, 'tiny.png'), PNG_BASE64)
  const res = await request(app.getHttpServer())
    .post('/api/uploads-image')
    .attach('file', pngPath)
    .field('title', 'pic')
  expect([200,201]).toContain(res.status)
  expect(res.body.success).toBe(true)
  expect(res.body?.data?.file).toBeTruthy()
  // key should be a relative filename (no directory traversal)
  const key: string = res.body.data.file
  expect(key).not.toMatch(/^\//)
  expect(key).not.toContain('uploads/')
})

it('GET /api/uploads-image should include meta.baseUrls', async () => {
  const res = await request(app.getHttpServer()).get('/api/uploads-image')
  expect(res.status).toBe(200)
  expect(res.body.success).toBe(true)
  expect(res.body?.meta?.baseUrls?.file).toBeTruthy()
  expect(String(res.body.meta.baseUrls.file)).toMatch(/\/uploads\/?$/)
})

it('POST /api/uploads-image-png should reject non-png by extension/mime', async () => {
  const txtPath = path.join(tmpDir, 'note.txt')
  await fs.writeFile(txtPath, TXT_CONTENT, 'utf8')
  const res = await request(app.getHttpServer())
    .post('/api/uploads-image-png')
    .attach('file', txtPath)
  expect([200,201]).toContain(res.status)
  expect(res.body.success).toBe(false)
  const errStr = JSON.stringify(res.body.errors || [])
  expect(errStr).toMatch(/Invalid (extension|MIME)/)
})

it('GET /api/uploads-image with x-file-url=full echoes preference in meta', async () => {
  const res = await request(app.getHttpServer())
    .get('/api/uploads-image')
    .set('x-file-url', 'full')
  expect(res.status).toBe(200)
  expect(res.body.success).toBe(true)
  expect(res.body?.meta?.fileUrlMode).toBe('full')
})


