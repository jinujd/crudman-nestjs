# Types

Learn about the TypeScript types available in crudman-nestjs.

## Core Types

### CrudmanService

```typescript
class CrudmanService {
  list(section: string, req: any, res: any): Promise<CrudResponse>
  details(section: string, req: any, res: any): Promise<CrudResponse>
  create(section: string, req: any, res: any): Promise<CrudResponse>
  update(section: string, req: any, res: any): Promise<CrudResponse>
  delete(section: string, req: any, res: any): Promise<CrudResponse>
}
```

### CrudResponse

```typescript
interface CrudResponse {
  data: any;
  success: boolean;
  errors?: CrudError[];
  pagination?: PaginationInfo;
  filters?: FilterInfo[];
  sorting?: SortInfo[];
  meta?: Record<string, any>;
}
```

### CrudError

```typescript
interface CrudError {
  type: string;
  field?: string;
  message: string;
  value?: any;
}
```

## Configuration Types

### SectionConfig

```typescript
interface SectionConfig {
  model: any;
  list?: ListConfig;
  details?: DetailsConfig;
  create?: CreateConfig;
  update?: UpdateConfig;
  delete?: DeleteConfig;
  common?: CommonConfig;
}
```

### ListConfig

```typescript
interface ListConfig {
  relations?: string[];
  filtersWhitelist?: string[];
  sortingWhitelist?: string[];
  orderBy?: [string, 'ASC' | 'DESC'][];
  enableCache?: boolean | { ttl: number };
  onBeforeQuery?: (opts: any, model: any, ctx: any, req: any) => Promise<any>;
  onAfterFetch?: (items: any[], req: any, ctx: any) => Promise<any[]>;
  onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
  onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
}
```

### DetailsConfig

```typescript
interface DetailsConfig {
  relations?: string[];
  enableCache?: boolean;
  onBeforeQuery?: (opts: any, model: any, ctx: any, req: any) => Promise<any>;
  onAfterFetch?: (item: any, req: any, ctx: any) => Promise<any>;
  onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
  onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
}
```

### CreateConfig

```typescript
interface CreateConfig {
  fieldsForUniquenessValidation?: string[];
  getFinalValidationRules?: (rules: any) => any;
  onBeforeValidate?: (req: any, res: any, ctx: any, rules: any, validator: any) => Promise<boolean>;
  onAfterValidate?: (req: any, res: any, ctx: any, errors: any[], validator: any) => Promise<boolean>;
  onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
  onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
  upload?: UploadConfig;
}
```

### UpdateConfig

```typescript
interface UpdateConfig {
  fieldsForUniquenessValidation?: string[];
  getFinalValidationRules?: (rules: any) => Promise<boolean>;
  onBeforeValidate?: (req: any, res: any, ctx: any, rules: any, validator: any) => Promise<boolean>;
  onAfterValidate?: (req: any, res: any, ctx: any, errors: any[], validator: any) => Promise<boolean>;
  onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
  onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
  upload?: UploadConfig;
}
```

### DeleteConfig

```typescript
interface DeleteConfig {
  onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
  onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
}
```

### CommonConfig

```typescript
interface CommonConfig {
  uploadable?: Record<string, string>;
  uploadDefaults?: { storage: string };
  context?: (req: any, res: any, cfg: any, moduleRef: any) => Promise<any>;
}
```

## Upload Types

### UploadConfig

```typescript
interface UploadConfig {
  sources?: ('multipart' | 'base64')[];
  map?: UploadMap[];
}
```

### UploadMap

```typescript
interface UploadMap {
  sourceField: string;
  storageMode: 'filename' | 'filename_in_field' | 'base64' | 'blob';
  storage: string;
  targetField: string | { key: string; url: string } | { keys: string; urls: string };
  typeHint?: string;
  validators?: UploadValidators;
  isArray?: boolean;
}
```

### UploadValidators

```typescript
interface UploadValidators {
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}
```

## Cache Types

### CacheAdapter

```typescript
interface CacheAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}
```

### RedisCacheAdapter

```typescript
class RedisCacheAdapter implements CacheAdapter {
  constructor(options: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  });
}
```

### MemoryCacheAdapter

```typescript
class MemoryCacheAdapter implements CacheAdapter {
  constructor(options?: {
    max?: number;
    ttl?: number;
    checkperiod?: number;
  });
}
```

## Storage Types

### StorageAdapter

```typescript
interface StorageAdapter {
  store(file: Buffer, filename: string): Promise<string>;
  retrieve(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
}
```

### LocalStorageAdapter

```typescript
class LocalStorageAdapter implements StorageAdapter {
  constructor(options: {
    dest: string;
    publicBaseUrl: string;
  });
}
```

### S3StorageAdapter

```typescript
class S3StorageAdapter implements StorageAdapter {
  constructor(options: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  });
}
```

## Validator Types

### ValidatorAdapter

```typescript
interface ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean): any;
  validate(input: any, schema: any): { valid: boolean; errors: any[] };
}
```

### FastestValidatorAdapter

```typescript
class FastestValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean): any;
  validate(input: any, schema: any): { valid: boolean; errors: any[] };
}
```

## ORM Types

### OrmAdapter

```typescript
interface OrmAdapter {
  findOne(model: any, id: any, opts?: any): Promise<any>;
  findMany(model: any, opts?: any): Promise<any[]>;
  create(model: any, data: any): Promise<any>;
  update(model: any, id: any, data: any): Promise<any>;
  delete(model: any, id: any): Promise<any>;
}
```

### TypeormAdapter

```typescript
class TypeormAdapter implements OrmAdapter {
  findOne(model: any, id: any, opts?: any): Promise<any>;
  findMany(model: any, opts?: any): Promise<any[]>;
  create(model: any, data: any): Promise<any>;
  update(model: any, id: any, data: any): Promise<any>;
  delete(model: any, id: any): Promise<any>;
}
```

## Utility Types

### PaginationInfo

```typescript
interface PaginationInfo {
  page: number;
  perPage: number;
  totalItemsCount: number;
  totalPagesCount: number;
  isHavingNextPage: boolean;
  isHavingPreviousPage: boolean;
}
```

### FilterInfo

```typescript
interface FilterInfo {
  field: string;
  operator: string;
  value: any;
}
```

### SortInfo

```typescript
interface SortInfo {
  field: string;
  direction: 'ASC' | 'DESC';
}
```

## Context Types

### CrudContext

```typescript
interface CrudContext {
  section: string;
  action: string;
  services?: Record<string, any>;
  repositories?: Record<string, any>;
  [key: string]: any;
}
```

## Best Practices

1. **Use TypeScript** for better type safety
2. **Define interfaces** for custom configurations
3. **Extend base types** when creating custom adapters
4. **Use generics** for reusable type definitions
5. **Document types** with JSDoc comments

## Next Steps

- [Decorators](/docs/api/decorators) - Learn about decorators
- [Configuration](/docs/api/configuration) - Learn about configuration
- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
