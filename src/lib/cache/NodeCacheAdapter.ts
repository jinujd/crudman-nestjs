import NodeCache from 'node-cache'
import { CacheAdapter } from './CacheAdapter'

export class NodeCacheAdapter implements CacheAdapter {
  private cache: NodeCache
  constructor(options?: { stdTTL?: number; checkperiod?: number; maxKeys?: number }) {
    this.cache = new NodeCache({ stdTTL: options?.stdTTL, checkperiod: options?.checkperiod, maxKeys: options?.maxKeys })
  }
  get<T = any>(key: string): T | undefined {
    return this.cache.get<T>(key)
  }
  set(key: string, value: any, ttlSeconds?: number): boolean {
    return this.cache.set(key, value, ttlSeconds || 0)
  }
  del(key: string | string[]): number {
    return this.cache.del(key as any)
  }
  flush() {
    this.cache.flushAll()
  }
}


