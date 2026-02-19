# Validations

Add robust validation to your CRUD endpoints with built-in and custom rules.

## Built-in Validation

crudman-nestjs uses fastest-validator by default, providing automatic validation based on your entity metadata:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
```

The library automatically generates validation rules:
- `name`: required string, max 100 characters
- `email`: required email format
- `isActive`: optional boolean

## Custom Validation Rules

Override or extend validation rules with `getFinalValidationRules`:

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      create: {
        getFinalValidationRules: (rules) => ({
          ...rules,
          name: { type: 'string', min: 2, max: 100, empty: false },
          email: { type: 'email', empty: false },
          password: { type: 'string', min: 8, empty: false }
        })
      },
      update: {
        getFinalValidationRules: (rules) => ({
          ...rules,
          name: { type: 'string', min: 2, max: 100, optional: true },
          email: { type: 'email', optional: true },
          password: { type: 'string', min: 8, optional: true }
        })
      }
    }
  }
})
```

## Uniqueness Validation

Ensure unique values across your database:

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      create: {
        fieldsForUniquenessValidation: ['email', 'username']
      },
      update: {
        fieldsForUniquenessValidation: ['email', 'username']
      }
    }
  }
})
```

### Compound Uniqueness

For fields that must be unique together:

```typescript
create: {
  fieldsForUniquenessValidation: ['tenantId', 'slug'],
  conditionTypeForUniquenessValidation: 'and'
}
```

## Validation Hooks

Customize validation behavior with hooks:

### onBeforeValidate

Modify rules before validation:

```typescript
create: {
  onBeforeValidate: async (req, res, ctx, rules, validator) => {
    // Add custom rules based on request context
    if (req.body.role === 'admin') {
      rules.permissions = { type: 'array', items: 'string' }
    }
    return true
  }
}
```

### onAfterValidate

Perform custom validation checks:

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

## Validator Adapters

### Joi Validator

```typescript
import Joi from 'joi'

export class JoiValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) {
    return Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      isActive: Joi.boolean().optional()
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
      email: z.string().email(),
      isActive: z.boolean().optional()
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

## Register Custom Validator

```typescript
CrudmanModule.forRoot({
  defaultValidator: new JoiValidatorAdapter()
})
```

## Validation Error Response

When validation fails, the API returns a structured error response:

```json
{
  "success": false,
  "errors": [
    {
      "type": "stringMin",
      "field": "name",
      "message": "The 'name' field length must be greater than or equal to 2 characters long."
    },
    {
      "type": "email",
      "field": "email", 
      "message": "The 'email' field must be a valid e-mail."
    }
  ]
}
```

## Best Practices

1. **Use entity metadata** for basic validation rules
2. **Add custom rules** for business logic validation
3. **Implement uniqueness validation** for critical fields
4. **Use validation hooks** for complex scenarios
5. **Choose the right validator** for your team's preferences

## Next Steps

- [Hooks](/docs/guides/hooks) - Learn about the hooks system
- [File Uploads](/docs/guides/file-uploads) - Handle file validation
- [Swagger API](/docs/guides/swagger-api) - Document validation rules
