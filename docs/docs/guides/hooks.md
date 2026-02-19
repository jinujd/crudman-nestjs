# Hooks

Customize any aspect of your CRUD operations with the powerful hooks system.

## Overview

Hooks allow you to intercept and modify the behavior of CRUD operations at various points in the request lifecycle. They provide fine-grained control over:

- **Action execution** - Before/after CRUD operations
- **Query building** - Modify database queries
- **Data transformation** - Transform results before sending
- **Validation** - Custom validation logic
- **Context injection** - Access services and repositories

## Action Hooks

### onBeforeAction

Execute code before any CRUD operation:

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      list: {
        onBeforeAction: async (req, res, ctx) => {
          // Check permissions
          if (!req.identity?.id) {
            res.status(401).send({ success: false, errors: [{ message: 'Unauthorized' }] })
            return false
          }
          return true
        }
      }
    }
  }
})
```

### onAfterAction

Modify the response before sending:

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

## Query Hooks

### onBeforeQuery

Modify database queries before execution:

```typescript
list: {
  onBeforeQuery: async (opts, model, ctx, req) => {
    // Add tenant scoping
    const tenantId = req.identity?.tenantId
    if (tenantId) {
      opts.where = { ...opts.where, tenantId }
    }
    
    // Force default ordering
    opts.order = opts.order || { createdAt: 'DESC' }
    
    return opts
  }
}
```

### onAfterFetch

Transform data after fetching from database:

```typescript
list: {
  onAfterFetch: async (items, req, ctx) => {
    // Add computed fields
    return items.map(item => ({
      ...item,
      fullName: `${item.firstName} ${item.lastName}`,
      isActive: item.status === 'active'
    }))
  }
}
```

## Validation Hooks

### onBeforeValidate

Modify validation rules before validation:

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

Perform custom validation after built-in validation:

```typescript
create: {
  onAfterValidate: async (req, res, ctx, errors, validator) => {
    // Custom business logic validation
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

## Context Injection

Access services, repositories, and other dependencies through the context object:

### Inject Services

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      context: async (req, res, cfg, moduleRef) => {
        const billingService = moduleRef.get(BillingService, { strict: false })
        const mailerService = moduleRef.get(MailerService, { strict: false })
        
        return {
          services: { billing: billingService, mailer: mailerService }
        }
      },
      create: {
        onAfterAction: async (result, req, ctx) => {
          // Use injected services
          await ctx.services.mailer.sendWelcomeEmail(result.data.email)
          await ctx.services.billing.createAccount(result.data.id)
          return result
        }
      }
    }
  }
})
```

### Inject Repositories

```typescript
context: async (req, res, cfg, moduleRef) => {
  const ds = moduleRef.get(DataSource, { strict: false })
  return {
    repositories: {
      audit: ds.getRepository(AuditLog),
      company: ds.getRepository(Company)
    }
  }
}
```

## Cross-Section Calls

Call other CRUD operations from within hooks:

```typescript
create: {
  onAfterAction: async (result, req, ctx) => {
    // Create related entity
    const relatedReq = {
      ...req,
      body: { name: 'Related Item', userId: result.data.id }
    }
    
    const relatedResult = await ctx.service.callAction(
      'related-section', 
      'create', 
      relatedReq, 
      res, 
      false
    )
    
    if (!relatedResult.data.success) {
      // Handle error
      return { ...result, errors: relatedResult.data.errors }
    }
    
    return result
  }
}
```

## Hook Execution Order

### List Operation
1. `onBeforeAction`
2. Resolve relations
3. Cache check
4. `onBeforeQuery`
5. Database fetch
6. `onAfterFetch`
7. Format response
8. `onAfterAction`
9. Store in cache
10. Send response

### Create/Update Operation
1. `onBeforeAction`
2. Generate validation rules
3. `getFinalValidationRules`
4. `onBeforeValidate`
5. Validate
6. `onAfterValidate`
7. Database write
8. Format response
9. `onAfterAction`
10. Invalidate cache
11. Send response

## Best Practices

1. **Use context injection** for accessing services and repositories
2. **Keep hooks focused** on single responsibilities
3. **Handle errors gracefully** in hooks
4. **Use cross-section calls** for related operations
5. **Test hooks thoroughly** as they affect core functionality

## Common Use Cases

### Tenant Scoping
```typescript
onBeforeQuery: async (opts, model, ctx, req) => {
  const tenantId = req.identity?.tenantId
  if (tenantId) {
    opts.where = { ...opts.where, tenantId }
  }
  return opts
}
```

### Audit Logging
```typescript
onAfterAction: async (result, req, ctx) => {
  await ctx.repositories.audit.save({
    action: ctx.action,
    section: ctx.section,
    userId: req.identity?.id,
    timestamp: new Date()
  })
  return result
}
```

### Data Enrichment
```typescript
onAfterFetch: async (items, req, ctx) => {
  return items.map(item => ({
    ...item,
    computedField: await ctx.services.calculator.compute(item.id)
  }))
}
```

## Next Steps

- [File Uploads](/docs/guides/file-uploads) - Handle file operations
- [Swagger API](/docs/guides/swagger-api) - Document your API
- [Advanced Features](/docs/advanced/adapters) - Learn about adapters
