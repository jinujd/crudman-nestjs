# Testing

Learn how to test your crudman-nestjs applications.

## Unit Testing

### Testing Controllers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { CrudmanService } from 'crudman-nestjs';

describe('UsersController', () => {
  let controller: UsersController;
  let service: CrudmanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [CrudmanService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<CrudmanService>(CrudmanService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
```

### Testing with Mock Data

```typescript
describe('UsersController', () => {
  it('should create a user', async () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const result = await controller.create(createUserDto);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('John Doe');
  });
});
```

## Integration Testing

### Testing API Endpoints

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/users')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('/api/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('John Doe');
      });
  });
});
```

## Testing Hooks

### Testing onBeforeAction

```typescript
describe('UsersController Hooks', () => {
  it('should execute onBeforeAction hook', async () => {
    const mockReq = {
      body: { name: 'John Doe', email: 'john@example.com' },
      identity: { id: 1 }
    };

    const result = await controller.create(mockReq);
    
    // Verify hook was executed
    expect(result.meta.hookExecuted).toBe(true);
  });
});
```

### Testing Validation Hooks

```typescript
describe('Validation Hooks', () => {
  it('should validate email domain', async () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@invalid.com'
    };

    const result = await controller.create(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'email',
      message: 'Email must be from company domain'
    });
  });
});
```

## Testing File Uploads

### Testing Multipart Requests

```typescript
import * as fs from 'fs';
import * as path from 'path';

describe('File Uploads', () => {
  it('should upload avatar image', async () => {
    const avatarPath = path.join(__dirname, 'fixtures', 'avatar.jpg');
    const avatarBuffer = fs.readFileSync(avatarPath);

    return request(app.getHttpServer())
      .post('/api/users')
      .field('name', 'John Doe')
      .field('email', 'john@example.com')
      .attach('avatar', avatarBuffer, 'avatar.jpg')
      .expect(201)
      .expect((res) => {
        expect(res.body.data.avatarKey).toBeDefined();
        expect(res.body.data.avatarUrl).toBeDefined();
      });
  });
});
```

## Testing with Database

### Using Test Database

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('Users with Database', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        // ... other imports
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.synchronize(true);
  });
});
```

## Testing Swagger Documentation

### Testing API Documentation

```typescript
describe('Swagger Documentation', () => {
  it('should generate valid OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);

    const spec = response.body;
    
    expect(spec.openapi).toBeDefined();
    expect(spec.paths['/api/users']).toBeDefined();
    expect(spec.components.schemas.User).toBeDefined();
  });
});
```

## Best Practices

1. **Use test database** for integration tests
2. **Mock external services** in unit tests
3. **Test error scenarios** not just success cases
4. **Use fixtures** for test data
5. **Clean up** after each test

## Next Steps

- [Deployment](/docs/advanced/deployment) - Deploy your application
- [Adapters](/docs/advanced/adapters) - Learn about adapters
- [API Reference](/docs/api/configuration) - Configuration options
