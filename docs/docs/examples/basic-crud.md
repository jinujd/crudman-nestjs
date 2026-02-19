# Basic CRUD Example

A complete example of creating a REST API with crudman-nestjs.

## Project Setup

### 1. Install Dependencies

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install typeorm sqlite3
npm install crudman-nestjs
```

### 2. Create Entity

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 3. Create Controller

```typescript
// users.controller.ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

### 4. Configure Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudmanModule, TypeormAdapter } from 'crudman-nestjs';
import { User } from './user.entity';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'test.sqlite',
      entities: [User],
      synchronize: true,
    }),
    CrudmanModule.forRoot({
      defaultOrm: TypeormAdapter,
      swagger: { enabled: true },
      cache: { enabled: true }
    }),
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
})
export class AppModule {}
```

### 5. Bootstrap Application

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { enhanceCrudSwaggerDocument } from 'crudman-nestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('User API')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  enhanceCrudSwaggerDocument(document);
  SwaggerModule.setup('docs', app, document);
  
  await app.listen(3000);
}
bootstrap();
```

## API Endpoints

Your API now provides:

### List Users
```bash
GET /api/users
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `perPage` - Items per page (default: 20)
- `sort` - Sorting (e.g., `sort.createdAt=desc`)
- `filter` - Filtering (e.g., `filter.name=John`)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalItemsCount": 1,
    "totalPagesCount": 1
  }
}
```

### Get User Details
```bash
GET /api/users/1
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "success": true
}
```

### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "success": true
}
```

### Update User
```bash
PATCH /api/users/2
Content-Type: application/json

{
  "name": "Jane Smith"
}
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "success": true
}
```

### Delete User
```bash
DELETE /api/users/2
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "success": true
}
```

## Testing with cURL

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

### List Users
```bash
curl http://localhost:3000/api/users
```

### Get User Details
```bash
curl http://localhost:3000/api/users/1
```

### Update User
```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith"}'
```

### Delete User
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## Swagger Documentation

Visit `http://localhost:3000/docs` to see the interactive API documentation.

## Next Steps

- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
- [File Uploads](/docs/guides/file-uploads) - Handle file operations
- [Swagger API](/docs/guides/swagger-api) - Generate documentation
