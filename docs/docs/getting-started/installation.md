# Installation

Get started with crudman-nestjs in minutes.

## Prerequisites

- Node.js 16+ 
- NestJS application
- TypeORM (recommended) or other ORM

## Install the Package

```bash
npm install crudman-nestjs
```

## Quick Setup

1. **Import the module** in your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CrudmanModule } from 'crudman-nestjs';

@Module({
  imports: [
    CrudmanModule.forRoot({
      swagger: { enabled: true },
      cache: { enabled: true },
    }),
  ],
})
export class AppModule {}
```

2. **Create your first CRUD controller**:

```typescript
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

3. **That's it!** You now have:
   - `GET /api/users` - List users
   - `GET /api/users/:id` - Get user details
   - `POST /api/users` - Create user
   - `PATCH /api/users/:id` - Update user
   - `DELETE /api/users/:id` - Delete user

## Next Steps

- [Basic CRUD Generation](/docs/guides/basic-crud) - Learn the fundamentals
- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
- [File Uploads](/docs/guides/file-uploads) - Handle file uploads
- [Swagger API](/docs/guides/swagger-api) - Generate documentation
