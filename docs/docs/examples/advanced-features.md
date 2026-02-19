# Advanced Features Example

A comprehensive example showcasing advanced features of crudman-nestjs.

## Project Setup

### 1. Install Dependencies

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install typeorm sqlite3
npm install crudman-nestjs
npm install redis
npm install @nestjs/swagger
```

### 2. Create Entities

```typescript
// user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Company } from './company.entity';

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

  @Column({ nullable: true })
  avatarKey!: string | null;

  @Column({ nullable: true })
  avatarUrl!: string | null;

  @OneToMany(() => Company, company => company.owner)
  companies!: Company[];

  @CreateDateColumn()
  createdAt!: Date;
}

// company.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  ownerId!: number | null;

  @ManyToOne(() => User, user => user.companies)
  @JoinColumn({ name: 'ownerId' })
  owner!: User | null;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### 3. Create Services

```typescript
// billing.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async createAccount(userId: number): Promise<void> {
    console.log(`Creating billing account for user ${userId}`);
    // Billing logic here
  }

  async updateAccount(userId: number, data: any): Promise<void> {
    console.log(`Updating billing account for user ${userId}`, data);
    // Update billing logic here
  }
}

// mailer.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  async sendWelcomeEmail(email: string): Promise<void> {
    console.log(`Sending welcome email to ${email}`);
    // Email logic here
  }

  async sendNotificationEmail(email: string, message: string): Promise<void> {
    console.log(`Sending notification to ${email}: ${message}`);
    // Notification logic here
  }
}
```

### 4. Create Controllers with Advanced Features

```typescript
// users.controller.ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({
  sections: {
    users: {
      model: User,
      list: {
        relations: ['companies'],
        filtersWhitelist: ['name', 'email', 'isActive'],
        sortingWhitelist: ['createdAt', 'name'],
        orderBy: [['createdAt', 'DESC']],
        enableCache: { ttl: 60 },
        onBeforeQuery: async (opts, model, ctx, req) => {
          // Add tenant scoping
          const tenantId = req.identity?.tenantId;
          if (tenantId) {
            opts.where = { ...opts.where, tenantId };
          }
          return opts;
        },
        onAfterFetch: async (items, req, ctx) => {
          // Add computed fields
          return items.map(item => ({
            ...item,
            fullName: `${item.name}`,
            companyCount: item.companies?.length || 0
          }));
        }
      },
      details: {
        relations: ['companies'],
        enableCache: true
      },
      create: {
        fieldsForUniquenessValidation: ['email'],
        getFinalValidationRules: (rules) => ({
          ...rules,
          name: { type: 'string', min: 2, max: 100, empty: false },
          email: { type: 'email', empty: false }
        }),
        onBeforeValidate: async (req, res, ctx, rules, validator) => {
          // Add conditional validation
          if (req.body.role === 'admin') {
            rules.permissions = { type: 'array', items: 'string' };
          }
          return true;
        },
        onAfterValidate: async (req, res, ctx, errors, validator) => {
          // Custom business logic validation
          if (req.body.email && !req.body.email.includes('@company.com')) {
            errors.push({
              type: 'custom',
              field: 'email',
              message: 'Email must be from company domain'
            });
          }
          return errors.length === 0;
        },
        onAfterAction: async (result, req, ctx) => {
          // Use injected services
          await ctx.services.mailer.sendWelcomeEmail(result.data.email);
          await ctx.services.billing.createAccount(result.data.id);
          
          return {
            ...result,
            servedAt: new Date().toISOString(),
            requestId: req.headers['x-request-id']
          };
        }
      },
      update: {
        fieldsForUniquenessValidation: ['email'],
        onAfterAction: async (result, req, ctx) => {
          // Update billing information
          await ctx.services.billing.updateAccount(result.data.id, req.body);
          return result;
        }
      },
      common: {
        uploadable: { avatar: 'image' },
        uploadDefaults: { storage: 'local' },
        context: async (req, res, cfg, moduleRef) => {
          const billingService = moduleRef.get(BillingService, { strict: false });
          const mailerService = moduleRef.get(MailerService, { strict: false });
          
          return {
            services: { billing: billingService, mailer: mailerService }
          };
        }
      }
    }
  }
})
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

### 5. Configure Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudmanModule, TypeormAdapter } from 'crudman-nestjs';
import { User } from './user.entity';
import { Company } from './company.entity';
import { UsersController } from './users.controller';
import { BillingService } from './billing.service';
import { MailerService } from './mailer.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'test.sqlite',
      entities: [User, Company],
      synchronize: true,
    }),
    CrudmanModule.forRoot({
      defaultOrm: TypeormAdapter,
      swagger: { enabled: true },
      cache: {
        enabled: true,
        adapter: new RedisCacheAdapter({
          url: process.env.REDIS_URL || 'redis://localhost:6379'
        })
      },
      fileStorages: {
        local: {
          type: 'local',
          dest: 'uploads',
          publicBaseUrl: 'http://localhost:3000/uploads'
        }
      }
    }),
    TypeOrmModule.forFeature([User, Company])
  ],
  controllers: [UsersController],
  providers: [BillingService, MailerService],
})
export class AppModule {}
```

## Advanced Features Examples

### 1. List Users with Relations and Caching

```bash
curl http://localhost:3000/api/users?relations=companies&page=1&perPage=10
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@company.com",
      "isActive": true,
      "fullName": "John Doe",
      "companyCount": 2,
      "companies": [
        {
          "id": 1,
          "name": "Acme Corp",
          "description": "A great company"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalItemsCount": 1,
    "totalPagesCount": 1
  }
}
```

### 2. Create User with Validation and Hooks

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@company.com",
    "role": "admin"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@company.com",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "success": true,
  "servedAt": "2024-01-15T11:00:00Z",
  "requestId": "req-123"
}
```

### 3. Create User with File Upload

```bash
curl -X POST http://localhost:3000/api/users \
  -F "name=John Smith" \
  -F "email=john@company.com" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Response:**
```json
{
  "data": {
    "id": 3,
    "name": "John Smith",
    "email": "john@company.com",
    "isActive": true,
    "avatarKey": "uploads/avatars/3.jpg",
    "avatarUrl": "uploads/avatars/3.jpg",
    "createdAt": "2024-01-15T11:30:00Z"
  },
  "success": true,
  "servedAt": "2024-01-15T11:30:00Z",
  "requestId": "req-124"
}
```

### 4. Update User with Business Logic

```bash
curl -X PATCH http://localhost:3000/api/users/3 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith Jr",
    "email": "john.jr@company.com"
  }'
```

**Response:**
```json
{
  "data": {
    "id": 3,
    "name": "John Smith Jr",
    "email": "john.jr@company.com",
    "isActive": true,
    "avatarKey": "uploads/avatars/3.jpg",
    "avatarUrl": "uploads/avatars/3.jpg",
    "createdAt": "2024-01-15T11:30:00Z"
  },
  "success": true
}
```

## Testing Advanced Features

### Unit Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { BillingService } from './billing.service';
import { MailerService } from './mailer.service';

describe('UsersController', () => {
  let controller: UsersController;
  let billingService: BillingService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [BillingService, MailerService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    billingService = module.get<BillingService>(BillingService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should create user with hooks', async () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@company.com'
    };

    const result = await controller.create(createUserDto);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('John Doe');
    expect(result.servedAt).toBeDefined();
    expect(result.requestId).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Advanced Features (e2e)', () => {
  let app: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should list users with relations', () => {
    return request(app.getHttpServer())
      .get('/api/users?relations=companies')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('should create user with file upload', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .field('name', 'John Doe')
      .field('email', 'john@company.com')
      .attach('avatar', 'test/fixtures/avatar.jpg')
      .expect(201)
      .expect((res) => {
        expect(res.body.data.avatarKey).toBeDefined();
        expect(res.body.data.avatarUrl).toBeDefined();
      });
  });
});
```

## Best Practices

1. **Use context injection** for accessing services
2. **Keep hooks focused** on single responsibilities
3. **Handle errors gracefully** in hooks
4. **Test advanced features** thoroughly
5. **Use caching** for better performance
6. **Implement proper validation** for data integrity

## Next Steps

- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
- [File Uploads](/docs/guides/file-uploads) - Handle file operations
- [Swagger API](/docs/guides/swagger-api) - Generate documentation
