# Basic CRUD Generation

Learn how to generate complete REST APIs with zero boilerplate.

## Auto Routes with CrudControllerBase

The simplest way to create CRUD endpoints is using `CrudControllerBase`:

```typescript
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

This single controller provides all CRUD operations:
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details  
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Multiple Sections in One Controller

Handle multiple entities in a single controller:

```typescript
import { Controller, Get, Post, Patch, Delete } from '@nestjs/common';
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete } from 'crudman-nestjs';
import { User } from './user.entity';
import { Company } from './company.entity';

@UseCrud({
  sections: {
    users: { model: User },
    companies: { model: Company }
  }
})
@Controller('api')
export class ApiController {
  // Users endpoints
  @Get('users')
  @CrudList('users')
  listUsers() {}

  @Get('users/:id')
  @CrudDetails('users')
  getUser() {}

  @Post('users')
  @CrudCreate('users')
  createUser() {}

  @Patch('users/:id')
  @CrudUpdate('users')
  updateUser() {}

  @Delete('users/:id')
  @CrudDelete('users')
  deleteUser() {}

  // Companies endpoints
  @Get('companies')
  @CrudList('companies')
  listCompanies() {}

  @Get('companies/:id')
  @CrudDetails('companies')
  getCompany() {}

  @Post('companies')
  @CrudCreate('companies')
  createCompany() {}

  @Patch('companies/:id')
  @CrudUpdate('companies')
  updateCompany() {}

  @Delete('companies/:id')
  @CrudDelete('companies')
  deleteCompany() {}
}
```

## Shorthand Models

Create CRUD endpoints for multiple models without writing section objects:

```typescript
@UseCrud({
  models: [User, Company, State],
  defaults: {
    pathStyle: 'kebab',
    updateMethod: 'patch',
    attributes: { read: '*', write: '*' },
    relations: '*'
  }
})
@Controller('api')
export class ApiController extends CrudControllerBase('*') {}
```

Routes generated:
- User → `/api/users`
- Company → `/api/companies`  
- State → `/api/states`

## Section Configuration

Configure each section with specific options:

```typescript
@UseCrud({
  sections: {
    companies: {
      model: Company,
      list: {
        relations: ['contacts'],
        filtersWhitelist: ['name', 'isActive', 'createdAt'],
        sortingWhitelist: ['createdAt', 'name'],
        orderBy: [['createdAt', 'DESC']],
        enableCache: { ttl: 60 }
      },
      details: { 
        relations: ['contacts'],
        enableCache: true 
      },
      create: { 
        fieldsForUniquenessValidation: ['name']
      },
      update: { 
        fieldsForUniquenessValidation: ['name']
      }
    }
  }
})
```

## Query Parameters

### List Endpoints

**Pagination:**
```
GET /api/users?page=2&perPage=20
```

**Sorting:**
```
GET /api/users?sort.createdAt=desc&sort.name=asc
```

**Filtering:**
```
GET /api/users?name=John&isActive=1
GET /api/users?name.like=john
GET /api/users?createdAt.between=2024-01-01,2024-01-31
```

**Keyword Search:**
```
GET /api/users?keyword=john
```

### Response Format

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalItemsCount": 100,
    "totalPagesCount": 5,
    "isHavingNextPage": true,
    "isHavingPreviousPage": false
  },
  "filters": [],
  "sorting": []
}
```

## Next Steps

- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
- [File Uploads](/docs/guides/file-uploads) - Handle file uploads
- [Swagger API](/docs/guides/swagger-api) - Generate documentation
