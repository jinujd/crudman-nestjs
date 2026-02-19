# Decorators

Learn about the decorators available in crudman-nestjs.

## @UseCrud

The main decorator for configuring CRUD operations.

### Basic Usage

```typescript
@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

### Configuration Options

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
      },
      details: { 
        relations: ['profile'],
        enableCache: true 
      },
      create: { 
        fieldsForUniquenessValidation: ['email']
      },
      update: { 
        fieldsForUniquenessValidation: ['email']
      }
    }
  }
})
```

## @CrudList

Decorator for list endpoints.

```typescript
@Get('users')
@CrudList('users')
listUsers() {}
```

## @CrudDetails

Decorator for details endpoints.

```typescript
@Get('users/:id')
@CrudDetails('users')
getUser() {}
```

## @CrudCreate

Decorator for create endpoints.

```typescript
@Post('users')
@CrudCreate('users')
createUser() {}
```

## @CrudUpdate

Decorator for update endpoints.

```typescript
@Patch('users/:id')
@CrudUpdate('users')
updateUser() {}
```

## @CrudDelete

Decorator for delete endpoints.

```typescript
@Delete('users/:id')
@CrudDelete('users')
deleteUser() {}
```

## Configuration Options

### Section Configuration

```typescript
interface SectionConfig {
  model: any;
  list?: {
    relations?: string[];
    filtersWhitelist?: string[];
    sortingWhitelist?: string[];
    orderBy?: [string, 'ASC' | 'DESC'][];
    enableCache?: boolean | { ttl: number };
  };
  details?: {
    relations?: string[];
    enableCache?: boolean;
  };
  create?: {
    fieldsForUniquenessValidation?: string[];
    getFinalValidationRules?: (rules: any) => any;
    onBeforeValidate?: (req: any, res: any, ctx: any, rules: any, validator: any) => Promise<boolean>;
    onAfterValidate?: (req: any, res: any, ctx: any, errors: any[], validator: any) => Promise<boolean>;
    onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
    onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
  };
  update?: {
    fieldsForUniquenessValidation?: string[];
    getFinalValidationRules?: (rules: any) => any;
    onBeforeValidate?: (req: any, res: any, ctx: any, rules: any, validator: any) => Promise<boolean>;
    onAfterValidate?: (req: any, res: any, ctx: any, errors: any[], validator: any) => Promise<boolean>;
    onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
    onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
  };
  delete?: {
    onBeforeAction?: (req: any, res: any, ctx: any) => Promise<boolean>;
    onAfterAction?: (result: any, req: any, ctx: any) => Promise<any>;
  };
  common?: {
    uploadable?: Record<string, string>;
    uploadDefaults?: { storage: string };
    context?: (req: any, res: any, cfg: any, moduleRef: any) => Promise<any>;
  };
}
```

### Global Configuration

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

## Hook Decorators

### onBeforeAction

```typescript
create: {
  onBeforeAction: async (req, res, ctx) => {
    // Check permissions
    if (!req.identity?.id) {
      res.status(401).send({ success: false, errors: [{ message: 'Unauthorized' }] })
      return false
    }
    return true
  }
}
```

### onAfterAction

```typescript
create: {
  onAfterAction: async (result, req, ctx) => {
    // Add metadata to response
    return {
      ...result,
      servedAt: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    }
  }
}
```

### onBeforeQuery

```typescript
list: {
  onBeforeQuery: async (opts, model, ctx, req) => {
    // Add tenant scoping
    const tenantId = req.identity?.tenantId
    if (tenantId) {
      opts.where = { ...opts.where, tenantId }
    }
    return opts
  }
}
```

### onAfterFetch

```typescript
list: {
  onAfterFetch: async (items, req, ctx) => {
    // Add computed fields
    return items.map(item => ({
      ...item,
      fullName: `${item.firstName} ${item.lastName}`
    }))
  }
}
```

## Validation Decorators

### getFinalValidationRules

```typescript
create: {
  getFinalValidationRules: (rules) => ({
    ...rules,
    name: { type: 'string', min: 2, max: 100, empty: false },
    email: { type: 'email', empty: false }
  })
}
```

### onBeforeValidate

```typescript
create: {
  onBeforeValidate: async (req, res, ctx, rules, validator) => {
    // Add conditional rules
    if (req.body.role === 'admin') {
      rules.permissions = { type: 'array', items: 'string' }
    }
    return true
  }
}
```

### onAfterValidate

```typescript
create: {
  onAfterValidate: async (req, res, ctx, errors, validator) => {
    // Custom validation
    if (req.body.email && !req.body.email.includes('@company.com')) {
      errors.push({
        type: 'custom',
        field: 'email',
        message: 'Email must be from company domain'
      })
    }
    return errors.length === 0
  }
}
```

## File Upload Decorators

### uploadable

```typescript
common: {
  uploadable: { 
    avatar: 'image',
    document: 'pdf',
    video: 'video'
  }
}
```

### upload

```typescript
create: {
  upload: {
    sources: ['multipart', 'base64'],
    map: [
      {
        sourceField: 'avatar',
        storageMode: 'filename',
        storage: 'local',
        targetField: { key: 'avatarKey', url: 'avatarUrl' },
        typeHint: 'image',
        validators: { maxSizeMB: 5 }
      }
    ]
  }
}
```

## Context Decorators

### context

```typescript
common: {
  context: async (req, res, cfg, moduleRef) => {
    const billingService = moduleRef.get(BillingService, { strict: false })
    const mailerService = moduleRef.get(MailerService, { strict: false })
    
    return {
      services: { billing: billingService, mailer: mailerService }
    }
  }
}
```

## Best Practices

1. **Use descriptive names** for sections
2. **Group related configurations** together
3. **Keep hooks focused** on single responsibilities
4. **Handle errors gracefully** in hooks
5. **Test decorators thoroughly** before production

## Next Steps

- [Configuration](/docs/api/configuration) - Learn about configuration options
- [Types](/docs/api/types) - Understand TypeScript types
- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
