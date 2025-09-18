import NodeCache from 'node-cache';
export class NodeCacheAdapter {
    constructor(options) {
        this.cache = new NodeCache({ stdTTL: options?.stdTTL, checkperiod: options?.checkperiod, maxKeys: options?.maxKeys });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value, ttlSeconds) {
        return this.cache.set(key, value, ttlSeconds || 0);
    }
    del(key) {
        return this.cache.del(key);
    }
    flush() {
        this.cache.flushAll();
    }
}
