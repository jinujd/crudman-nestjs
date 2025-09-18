import { NodeCacheAdapter } from '../cache/NodeCacheAdapter';
import { FastestValidatorAdapter } from '../validation/FastestValidatorAdapter';
export class CrudmanRegistry {
    constructor(options = {}) {
        this.options = options;
        if (options.cache?.enabled) {
            this.cache = new NodeCacheAdapter({ stdTTL: options.cache.stdTTL, checkperiod: options.cache.checkperiod, maxKeys: options.cache.maxKeys });
        }
    }
    static init(options = {}) {
        this.instance = new CrudmanRegistry(options);
    }
    static get() {
        if (!this.instance)
            this.instance = new CrudmanRegistry({});
        return this.instance;
    }
    getOptions() { return this.options; }
    getCache() { return this.cache; }
    getResponseFormatter() { return this.options.defaultResponseFormatter; }
    getValidator() { return this.options.defaultValidator || new FastestValidatorAdapter(); }
    getIdentityAccessor() { return this.options.identityAccessor || ((req) => req.identity || req.user || {}); }
    getRoleChecker() { return this.options.roleChecker || ((identity, roles) => !roles?.length || roles.includes(identity?.role)); }
    getDataSource() { return this.options.dataSource; }
    setDataSource(ds) { this.options.dataSource = ds; }
}
