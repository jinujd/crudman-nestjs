import { promises as fs, createWriteStream } from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import { FileStorageAdapter, FileStorageSaveInput, FileStorageSaveResult } from '../types/Upload'

export interface LocalDiskOptions {
  dest: string
  publicBaseUrl?: string
}

export class LocalDiskAdapter implements FileStorageAdapter {
  private opts: LocalDiskOptions
  constructor(opts: LocalDiskOptions) { this.opts = opts }

  async save(input: FileStorageSaveInput): Promise<FileStorageSaveResult> {
    const id = randomUUID()
    const ext = input.filename ? path.extname(input.filename) : ''
    const diskKey = path.join(this.opts.dest, id + ext)
    const abs = path.isAbsolute(diskKey) ? diskKey : path.join(process.cwd(), diskKey)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    if (input.buffer) {
      await fs.writeFile(abs, input.buffer)
    } else if (input.base64) {
      await fs.writeFile(abs, Buffer.from(stripDataUrl(input.base64), 'base64'))
    } else if (input.stream) {
      await new Promise<void>((resolve, reject) => {
        const ws = createWriteStream(abs)
        input.stream!.once('error', reject)
        ws.once('error', reject)
        ws.once('finish', () => resolve())
        input.stream!.pipe(ws)
      })
    } else {
      throw new Error('LocalDiskAdapter.save requires buffer, base64 or stream')
    }
    const relKey = path.relative(this.opts.dest, diskKey).replace(/^\.*\//, '').replace(/\\/g, '/')
    const url = this.opts.publicBaseUrl ? joinUrl(this.opts.publicBaseUrl, relKey) : undefined
    return { key: relKey, url, mime: input.mime, size: input.buffer?.length }
  }

  async delete(key: string): Promise<void> {
    const abs = path.isAbsolute(key) ? key : path.join(process.cwd(), this.opts.dest, key)
    try { await fs.unlink(abs) } catch {}
  }

  getUrl(key: string): string {
    if (this.opts.publicBaseUrl) {
      const rel = key.replace(/^\.*\//, '').replace(/\\/g, '/')
      return joinUrl(this.opts.publicBaseUrl, rel)
    }
    return key
  }
}

function stripDataUrl(s: string): string {
  const i = s.indexOf('base64,')
  return i >= 0 ? s.slice(i + 7) : s
}

function joinUrl(a: string, b: string): string {
  if (!a.endsWith('/')) a += '/'
  return a + b.replace(/^\//, '')
}


