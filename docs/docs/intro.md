# Welcome to crudman-nestjs

**Zero-boilerplate CRUD for NestJS** with TypeORM, Swagger, validation, and file uploads.

## What is crudman-nestjs?

crudman-nestjs is a powerful library that generates complete REST APIs with minimal code. It provides:

- **Auto-generated CRUD endpoints** - List, details, create, update, delete
- **Built-in validation** - Based on your entity metadata
- **File upload handling** - Images, videos, documents, archives
- **Swagger documentation** - Auto-generated API docs
- **Hooks system** - Customize any behavior
- **Caching support** - Redis and memory caching
- **Multiple ORMs** - TypeORM, Prisma, and more

## Quick Example

Create a complete REST API in just a few lines:

```typescript
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

This single controller provides:
- `GET /api/users` - List users with pagination, filtering, sorting
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Key Features

### 🚀 **Basic CRUD Generation**
- Zero boilerplate code
- Auto-generated endpoints
- Consistent response format
- Built-in pagination and filtering

### ✅ **Validations**
- Entity metadata validation
- Custom validation rules
- Uniqueness validation
- Multiple validator adapters (Joi, Zod)

### 🔗 **Hooks System**
- Before/after action hooks
- Query modification
- Data transformation
- Context injection

### 📁 **File Uploads**
- Multiple file types (images, videos, documents)
- Various storage modes
- Built-in validation
- Storage adapters (local, S3)

### 📚 **Swagger API**
- Auto-generated documentation
- Interactive testing
- Request/response schemas
- File upload specs

## Getting Started

1. **[Installation](/docs/getting-started/installation)** - Set up the library
2. **[Quick Start](/docs/getting-started/quick-start)** - Create your first API
3. **[Basic CRUD](/docs/guides/basic-crud)** - Learn the fundamentals
4. **[Validations](/docs/guides/validations)** - Add validation rules
5. **[Hooks](/docs/guides/hooks)** - Customize behavior
6. **[File Uploads](/docs/guides/file-uploads)** - Handle file operations
7. **[Swagger API](/docs/guides/swagger-api)** - Generate documentation

## Why crudman-nestjs?

### Traditional Approach
```typescript
// Lots of boilerplate code
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: any) {
    // Pagination logic
    // Filtering logic
    // Sorting logic
    // Response formatting
    return this.usersService.findAll(query)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Validation
    // Error handling
    // Response formatting
    return this.usersService.findOne(id)
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // Validation
    // Business logic
    // Response formatting
    return this.usersService.create(createUserDto)
  }

  // ... more endpoints
}
```

### With crudman-nestjs
```typescript
// Zero boilerplate
@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

## Community

- **GitHub**: [jinujd/crudman-nestjs](https://github.com/jinujd/crudman-nestjs)
- **NPM**: [crudman-nestjs](https://www.npmjs.com/package/crudman-nestjs)
- **Issues**: [Report bugs or request features](https://github.com/jinujd/crudman-nestjs/issues)
- **Discussions**: [Ask questions](https://github.com/jinujd/crudman-nestjs/discussions)

## License

MIT License - see [LICENSE](https://github.com/jinujd/crudman-nestjs/blob/main/LICENSE) for details.

---

Ready to get started? Check out our [Installation Guide](/docs/getting-started/installation)!