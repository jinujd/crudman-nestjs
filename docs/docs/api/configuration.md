# Configuration

Learn about all configuration options available in crudman-nestjs.

## Module Configuration

### CrudmanModule.forRoot()

```typescript
CrudmanModule.forRoot({
  swagger: {
    enabled: true,
    requestBodySchemaMode: 'inline',
    requestBodyContentTypes: ['json', 'form', 'multipart'],
    includeRelationsInWriteBody: false
  },
  cache: {
    enabled: true,
    adapter: new RedisCacheAdapter({
      url: process.env.REDIS_URL
    })
  },
  fileStorages: {
    local: {
      type: 'local',
      dest: 'uploads',
      publicBaseUrl: 'http://localhost:3000/uploads'
    }
  }
})
```

## Swagger Configuration

### Global Swagger Settings

```typescript
swagger: {
  enabled: boolean;                    // Enable/disable Swagger
  requestBodySchemaMode: 'inline' | 'ref';  // Schema mode
  requestBodyContentTypes: string[];  // Content types to support
  includeRelationsInWriteBody: boolean; // Include relations in write body
}
```

### Per-Section Swagger Settings

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      swagger: {
        enabled: true,
        requestBodySchemaMode: 'inline',
        requestBodyContentTypes: ['json', 'multipart'],
        includeRelationsInWriteBody: false
      }
    }
  }
})
```

## Cache Configuration

### Redis Cache

```typescript
cache: {
  enabled: true,
  adapter: new RedisCacheAdapter({
    url: 'redis://localhost:6379',
    host: 'localhost',
    port: 6379,
    password: 'password',
    db: 0
  })
}
```

### Memory Cache

```typescript
cache: {
  enabled: true,
  adapter: new MemoryCacheAdapter({
    max: 1000,        // Maximum number of items
    ttl: 3600,       // Time to live in seconds
    checkperiod: 120  // Check for expired items every 120 seconds
  })
}
```

### Custom Cache Adapter

```typescript
class CustomCacheAdapter implements CacheAdapter {
  async get(key: string): Promise<any> {
    // Custom get implementation
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Custom set implementation
  }

  async del(key: string): Promise<void> {
    // Custom delete implementation
  }
}

cache: {
  enabled: true,
  adapter: new CustomCacheAdapter()
}
```

## File Storage Configuration

### Local Storage

```typescript
fileStorages: {
  local: {
    type: 'local',
    dest: 'uploads',                    // Upload directory
    publicBaseUrl: 'http://localhost:3000/uploads'  // Public URL
  }
}
```

### S3 Storage

```typescript
fileStorages: {
  s3: {
    type: 's3',
    bucket: 'my-bucket',                 // S3 bucket name
    region: 'us-east-1',               // AWS region
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: 'https://s3.amazonaws.com'  // Optional custom endpoint
  }
}
```

### Custom Storage Adapter

```typescript
class CustomStorageAdapter implements StorageAdapter {
  async store(file: Buffer, filename: string): Promise<string> {
    // Custom storage implementation
    return `custom://${filename}`
  }

  async retrieve(key: string): Promise<Buffer> {
    // Custom retrieval implementation
    return Buffer.from('file content')
  }

  async delete(key: string): Promise<boolean> {
    // Custom deletion implementation
    return true
  }
}

fileStorages: {
  custom: {
    type: 'custom',
    adapter: new CustomStorageAdapter()
  }
}
```

## Validator Configuration

### Default Validator

```typescript
CrudmanModule.forRoot({
  defaultValidator: new FastestValidatorAdapter()
})
```

### Custom Validator

```typescript
class CustomValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) {
    // Generate schema from model
    return schema
  }

  validate(input: any, schema: any) {
    // Validate input against schema
    return { valid: boolean, errors: any[] }
  }
}

CrudmanModule.forRoot({
  defaultValidator: new CustomValidatorAdapter()
})
```

## ORM Configuration

### TypeORM Adapter

```typescript
CrudmanModule.forRoot({
  defaultOrm: TypeormAdapter
})
```

### Prisma Adapter

```typescript
CrudmanModule.forRoot({
  defaultOrm: PrismaAdapter
})
```

### Custom ORM Adapter

```typescript
class CustomOrmAdapter implements OrmAdapter {
  async findOne(model: any, id: any, opts?: any) {
    // Custom findOne implementation
  }

  async findMany(model: any, opts?: any) {
    // Custom findMany implementation
  }

  async create(model: any, data: any) {
    // Custom create implementation
  }

  async update(model: any, id: any, data: any) {
    // Custom update implementation
  }

  async delete(model: any, id: any) {
    // Custom delete implementation
  }
}

CrudmanModule.forRoot({
  defaultOrm: new CustomOrmAdapter()
})
```

## Section Configuration

### Basic Section

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      list: {
        relations: ['profile'],
        filtersWhitelist: ['name', 'email'],
        sortingWhitelist: ['createdAt', 'name'],
        orderBy: [['createdAt', 'DESC']],
        enableCache: { ttl: 60 }
      }
    }
  }
})
```

### Advanced Section

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      list: {
        relations: ['profile'],
        filtersWhitelist: ['name', 'email'],
        sortingWhitelist: ['createdAt', 'name'],
        orderBy: [['createdAt', 'DESC']],
        enableCache: { ttl: 60 },
        onBeforeQuery: async (opts, model, ctx, req) => {
          // Custom query logic
          return opts
        },
        onAfterFetch: async (items, req, ctx) => {
          // Custom data transformation
          return items
        }
      },
      create: {
        fieldsForUniquenessValidation: ['email'],
        getFinalValidationRules: (rules) => ({
          ...rules,
          name: { type: 'string', min: 2, max: 100 },
          email: { type: 'email' }
        }),
        onBeforeValidate: async (req, res, ctx, rules, validator) => {
          // Custom validation logic
          return true
        },
        onAfterValidate: async (req, res, ctx, errors, validator) => {
          // Custom validation checks
          return errors.length === 0
        },
        onBeforeAction: async (req, res, ctx) => {
          // Custom pre-action logic
          return true
        },
        onAfterAction: async (result, req, ctx) => {
          // Custom post-action logic
          return result
        }
      }
    }
  }
})
```

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Cache
REDIS_URL=redis://localhost:6379

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=my-bucket
```

### Optional Variables

```bash
# Application
NODE_ENV=production
PORT=3000

# Cache
CACHE_TTL=3600
CACHE_MAX_ITEMS=1000

# File Storage
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,application/pdf
```

## Best Practices

1. **Use environment variables** for sensitive configuration
2. **Enable caching** in production for better performance
3. **Configure file storage** based on your needs
4. **Set appropriate TTL** for cache entries
5. **Use validation** to ensure data integrity
6. **Test configuration** in development environment

## Next Steps

- [Decorators](/docs/api/decorators) - Learn about decorators
- [Types](/docs/api/types) - Understand TypeScript types
- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
