export interface CacheAdapter {
  get: <T = any>(key: string) => T | undefined
  set: (key: string, value: any, ttlSeconds?: number) => boolean
  del: (key: string | string[]) => number
  flush?: () => void
}


