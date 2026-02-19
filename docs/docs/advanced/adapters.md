# Adapters

Learn about the adapter system in crudman-nestjs.

## Overview

Adapters allow crudman-nestjs to work with different ORMs and databases. The library provides built-in adapters and allows you to create custom ones.

## Built-in Adapters

### TypeORM Adapter
```typescript
import { TypeormAdapter } from 'crudman-nestjs'

CrudmanModule.forRoot({
  defaultOrm: TypeormAdapter
})
```

### Prisma Adapter
```typescript
import { PrismaAdapter } from 'crudman-nestjs'

CrudmanModule.forRoot({
  defaultOrm: PrismaAdapter
})
```

## Custom Adapters

Create custom adapters for your specific needs:

```typescript
export class CustomAdapter implements OrmAdapter {
  async findOne(model: any, id: any, opts?: any) {
    // Custom implementation
  }

  async findMany(model: any, opts?: any) {
    // Custom implementation
  }

  async create(model: any, data: any) {
    // Custom implementation
  }

  async update(model: any, id: any, data: any) {
    // Custom implementation
  }

  async delete(model: any, id: any) {
    // Custom implementation
  }
}
```

## Validator Adapters

### Joi Validator
```typescript
import Joi from 'joi'

export class JoiValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) {
    return Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required()
    })
  }

  validate(input: any, schema: any) {
    const { error } = schema.validate(input, { abortEarly: false })
    return error 
      ? { valid: false, errors: error.details }
      : { valid: true, errors: [] }
  }
}
```

### Zod Validator
```typescript
import { z } from 'zod'

export class ZodValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) {
    return z.object({
      name: z.string().min(2).max(100),
      email: z.string().email()
    })
  }

  validate(input: any, schema: any) {
    const result = schema.safeParse(input)
    return result.success 
      ? { valid: true, errors: [] }
      : { valid: false, errors: result.error.issues }
  }
}
```

## Cache Adapters

### Redis Cache
```typescript
import { RedisCacheAdapter } from 'crudman-nestjs'

CrudmanModule.forRoot({
  cache: {
    enabled: true,
    adapter: new RedisCacheAdapter({
      host: 'localhost',
      port: 6379
    })
  }
})
```

### Memory Cache
```typescript
import { MemoryCacheAdapter } from 'crudman-nestjs'

CrudmanModule.forRoot({
  cache: {
    enabled: true,
    adapter: new MemoryCacheAdapter()
  }
})
```

## Storage Adapters

### Local Storage
```typescript
CrudmanModule.forRoot({
  fileStorages: {
    local: {
      type: 'local',
      dest: 'uploads',
      publicBaseUrl: 'http://localhost:3000/uploads'
    }
  }
})
```

### S3 Storage
```typescript
CrudmanModule.forRoot({
  fileStorages: {
    s3: {
      type: 's3',
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
})
```

## Custom Storage Adapter

```typescript
export class CustomStorageAdapter implements StorageAdapter {
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
```

## Best Practices

1. **Use built-in adapters** when possible
2. **Create custom adapters** for specific needs
3. **Test adapters thoroughly** before production
4. **Document custom adapters** for your team
5. **Consider performance** implications

## Next Steps

- [Testing](/docs/advanced/testing) - Test your adapters
- [Deployment](/docs/advanced/deployment) - Deploy with adapters
- [API Reference](/docs/api/configuration) - Configuration options
