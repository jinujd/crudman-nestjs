# Quick Start

Create your first CRUD API in 5 minutes.

## Step 1: Create an Entity

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;
}
```

## Step 2: Create a Controller

```typescript
// users.controller.ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

## Step 3: Test Your API

Start your NestJS application and test the endpoints:

```bash
# List users
curl http://localhost:3000/api/users

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get user details
curl http://localhost:3000/api/users/1

# Update user
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
```

## What You Get

Your single controller now provides:

- **GET /api/users** - List with pagination, filtering, sorting
- **GET /api/users/:id** - Get user details
- **POST /api/users** - Create new user
- **PATCH /api/users/:id** - Update user
- **DELETE /api/users/:id** - Delete user

## Response Format

All endpoints return consistent JSON responses:

```json
{
  "data": [...],
  "success": true,
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalItemsCount": 100
  }
}
```

## Next Steps

- [Basic CRUD Generation](/docs/guides/basic-crud) - Learn more about CRUD features
- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
