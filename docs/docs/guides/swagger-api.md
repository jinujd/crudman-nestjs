# Swagger API Documentation

Auto-generate comprehensive API documentation with crudman-nestjs.

## Quick Setup

Enable Swagger documentation with minimal configuration:

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { enhanceCrudSwaggerDocument } from 'crudman-nestjs'

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .build()

const document = SwaggerModule.createDocument(app, config)
enhanceCrudSwaggerDocument(document) // Auto-enhance CRUD endpoints
SwaggerModule.setup('docs', app, document)
```

## Auto-Generated Features

The `enhanceCrudSwaggerDocument` function automatically adds:

- **Complete API endpoints** for all CRUD operations
- **Request/Response schemas** based on TypeORM entities
- **File upload specifications** for multipart endpoints
- **Validation rules** and error responses
- **Pagination details** for list endpoints

## Entity-Driven Schemas

### Pre-register Entity Schemas

```typescript
import { generateOpenApiSchemaFromEntity } from 'crudman-nestjs'

// Pre-register entity schemas
doc.components.schemas = {
  Company: generateOpenApiSchemaFromEntity(Company),
  User: generateOpenApiSchemaFromEntity(User)
}
```

### Automatic Schema Generation

The library automatically generates OpenAPI schemas from your TypeORM entities:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 100 })
  name!: string

  @Column({ unique: true })
  email!: string

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createdAt!: Date
}
```

Generates:
```json
{
  "User": {
    "type": "object",
    "properties": {
      "id": { "type": "integer", "format": "int32" },
      "name": { "type": "string", "maxLength": 100 },
      "email": { "type": "string", "format": "email" },
      "isActive": { "type": "boolean", "default": true },
      "createdAt": { "type": "string", "format": "date-time" }
    },
    "required": ["name", "email"]
  }
}
```

## Configuration Options

### Global Swagger Settings

```typescript
CrudmanModule.forRoot({
  swagger: {
    enabled: true,
    requestBodySchemaMode: 'inline', // 'inline' | 'ref'
    requestBodyContentTypes: ['json','form','multipart'],
    includeRelationsInWriteBody: false
  }
})
```

### Per-Section Configuration

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

## Request Body Documentation

### JSON Requests
```json
{
  "requestBody": {
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "maxLength": 100 },
            "email": { "type": "string", "format": "email" },
            "isActive": { "type": "boolean" }
          },
          "required": ["name", "email"]
        }
      }
    }
  }
}
```

### Multipart Requests (File Uploads)
```json
{
  "requestBody": {
    "content": {
      "multipart/form-data": {
        "schema": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "email": { "type": "string" },
            "avatar": { "type": "string", "format": "binary" }
          }
        }
      }
    }
  }
}
```

## Response Documentation

### Success Responses
```json
{
  "responses": {
    "200": {
      "description": "Success",
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "data": { "$ref": "#/components/schemas/User" },
              "success": { "type": "boolean" }
            }
          }
        }
      }
    }
  }
}
```

### Error Responses
```json
{
  "responses": {
    "400": {
      "description": "Validation Error",
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "success": { "type": "boolean" },
              "errors": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": { "type": "string" },
                    "field": { "type": "string" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Query Parameters

### List Endpoints
```json
{
  "parameters": [
    {
      "name": "page",
      "in": "query",
      "schema": { "type": "integer", "minimum": 1, "default": 1 }
    },
    {
      "name": "perPage",
      "in": "query", 
      "schema": { "type": "integer", "minimum": 1, "maximum": 100, "default": 20 }
    },
    {
      "name": "sort",
      "in": "query",
      "schema": { "type": "object" },
      "description": "Sorting options (e.g., sort.createdAt=desc)"
    },
    {
      "name": "filter",
      "in": "query",
      "schema": { "type": "object" },
      "description": "Filtering options (e.g., filter.name=John)"
    }
  ]
}
```

## File Upload Documentation

### Multipart Endpoints
```json
{
  "requestBody": {
    "content": {
      "multipart/form-data": {
        "schema": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "avatar": { 
              "type": "string", 
              "format": "binary",
              "description": "User avatar image (max 5MB, JPEG/PNG)"
            }
          }
        }
      }
    }
  }
}
```

### File Validation Rules
```json
{
  "avatar": {
    "type": "string",
    "format": "binary",
    "description": "User avatar (max 5MB, JPEG/PNG only)",
    "x-validation": {
      "maxSizeMB": 5,
      "allowedMimeTypes": ["image/jpeg", "image/png"],
      "allowedExtensions": [".jpg", ".jpeg", ".png"]
    }
  }
}
```

## Interactive Testing

### Try API Endpoints
The Swagger UI provides interactive testing capabilities:

1. **Click "Try it out"** on any endpoint
2. **Fill in parameters** and request body
3. **Execute the request** and see the response
4. **Test file uploads** with the file picker

### Example: Create User with Avatar
```bash
# The Swagger UI will generate this curl command:
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: multipart/form-data" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "avatar=@/path/to/image.jpg"
```

## Export/Import Features

### Export with x-content-type Headers
```typescript
// Enable export/import with proper content types
CrudmanModule.forRoot({
  swagger: {
    enabled: true,
    requestBodyContentTypes: ['json', 'form', 'multipart']
  }
})
```

### Import from Swagger
```typescript
// Import existing Swagger definitions
const existingDoc = await import('./existing-swagger.json')
enhanceCrudSwaggerDocument(existingDoc)
```

## Custom DTOs

### Using Custom DTOs
```typescript
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', maxLength: 100 })
  name!: string

  @ApiProperty({ description: 'User email address', format: 'email' })
  email!: string

  @ApiProperty({ description: 'User avatar image', type: 'string', format: 'binary' })
  avatar?: string
}
```

### Register Custom DTOs
```typescript
doc.components.schemas = {
  ...doc.components.schemas,
  CreateUserDto: {
    type: 'object',
    properties: {
      name: { type: 'string', maxLength: 100, description: 'User full name' },
      email: { type: 'string', format: 'email', description: 'User email address' },
      avatar: { type: 'string', format: 'binary', description: 'User avatar image' }
    },
    required: ['name', 'email']
  }
}
```

## Advanced Configuration

### Custom Tags and Descriptions
```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      swagger: {
        tags: ['User Management'],
        description: 'User management endpoints',
        summary: 'CRUD operations for users'
      }
    }
  }
})
```

### Hide Endpoints
```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      swagger: {
        enabled: false // Hide from Swagger documentation
      }
    }
  }
})
```

## Best Practices

1. **Use entity metadata** for automatic schema generation
2. **Add custom descriptions** for better documentation
3. **Test file uploads** in Swagger UI
4. **Use consistent naming** for endpoints and schemas
5. **Document validation rules** clearly

## Common Use Cases

### API Documentation Site
```typescript
// Set up comprehensive API docs
const config = new DocumentBuilder()
  .setTitle('My API')
  .setDescription('Complete API documentation')
  .setVersion('1.0')
  .addTag('Users', 'User management')
  .addTag('Companies', 'Company management')
  .build()
```

### Development Testing
```typescript
// Enable detailed error responses for development
CrudmanModule.forRoot({
  swagger: {
    enabled: true,
    requestBodySchemaMode: 'inline',
    includeRelationsInWriteBody: true
  }
})
```

## Next Steps

- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
- [Validations](/docs/guides/validations) - Add validation rules
- [File Uploads](/docs/guides/file-uploads) - Handle file operations
- [Advanced Features](/docs/advanced/adapters) - Custom adapters
