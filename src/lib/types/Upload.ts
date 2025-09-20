export type UploadSource = 'multipart' | 'base64' | 'stream' | 'presigned'
export type UploadStorageMode = 'filename' | 'base64' | 'blob'

export interface UploadTargetFieldSingleFilename {
  key?: string
  url?: string
}

export interface UploadTargetFieldArrayFilename {
  keys?: string
  urls?: string
}

export interface UploadTargetFieldBlob {
  blob: string
  mime: string
}

export type UploadTargetField = string | UploadTargetFieldSingleFilename | UploadTargetFieldArrayFilename | UploadTargetFieldBlob

export interface UploadValidatorOptions {
  maxSizeMB?: number
  allowedMimeTypes?: string[]
  allowedExtensions?: string[]
}

export interface UploadMapEntry {
  sourceField: string
  targetField: UploadTargetField
  isArray?: boolean
  storageMode: UploadStorageMode
  storage?: string
  sources?: UploadSource[]
  deleteOnReplace?: boolean
  mode?: 'replace' | 'append'
  validators?: UploadValidatorOptions | any
  keyPattern?: (ctx: { section: string; field: string; originalName?: string; ext?: string; uuid: string }) => string
  typeHint?: 'image' | 'video' | 'pdf' | 'doc' | 'any'
}

export interface UploadConfig {
  sources?: UploadSource[]
  map: UploadMapEntry[]
}

export interface FileStorageSaveInput {
  buffer?: Buffer
  stream?: NodeJS.ReadableStream
  base64?: string
  mime?: string
  filename?: string
  keyHint?: string
}

export interface FileStorageSaveResult {
  key: string
  url?: string
  mime?: string
  size?: number
}

export interface FileStorageAdapter {
  save(input: FileStorageSaveInput): Promise<FileStorageSaveResult>
  delete?(key: string): Promise<void>
  getUrl?(key: string): string | Promise<string>
}


