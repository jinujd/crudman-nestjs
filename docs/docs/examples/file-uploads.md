# File Uploads Example

A complete example of handling file uploads with crudman-nestjs.

## Project Setup

### 1. Install Dependencies

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install typeorm sqlite3
npm install crudman-nestjs
```

### 2. Create Entity with File Fields

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

  @Column({ nullable: true })
  avatarKey!: string | null;

  @Column({ nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### 3. Create Controller with File Upload

```typescript
// users.controller.ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from './user.entity';

@UseCrud({
  sections: {
    users: {
      model: User,
      common: {
        uploadable: { avatar: 'image' },
        uploadDefaults: { storage: 'local' }
      }
    }
  }
})
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
      fileStorages: {
        local: {
          type: 'local',
          dest: 'uploads',
          publicBaseUrl: 'http://localhost:3000/uploads'
        }
      }
    }),
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
})
export class AppModule {}
```

## File Upload Examples

### 1. Create User with Avatar (Multipart)

```bash
curl -X POST http://localhost:3000/api/users \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "avatar=@/path/to/avatar.jpg"
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatarKey": "uploads/avatars/1.jpg",
    "avatarUrl": "uploads/avatars/1.jpg",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "success": true,
  "meta": {
    "baseUrls": {
      "uploads": "http://localhost:3000"
    }
  }
}
```

### 2. Create User with Avatar (Base64)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

### 3. Update User Avatar

```bash
curl -X PATCH http://localhost:3000/api/users/1 \
  -F "avatar=@/path/to/new-avatar.jpg"
```

## Advanced File Upload Configuration

### Multiple File Types

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      common: {
        uploadable: { 
          avatar: 'image',
          document: 'pdf',
          video: 'video'
        }
      }
    }
  }
})
```

### Custom Upload Configuration

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      create: {
        upload: {
          sources: ['multipart', 'base64'],
          map: [
            {
              sourceField: 'avatar',
              storageMode: 'filename',
              storage: 'local',
              targetField: { key: 'avatarKey', url: 'avatarUrl' },
              typeHint: 'image',
              validators: { maxSizeMB: 5 }
            }
          ]
        }
      }
    }
  }
})
```

### Multiple Files

```typescript
@UseCrud({
  sections: {
    users: {
      model: User,
      create: {
        upload: {
          sources: ['multipart'],
          map: [
            {
              sourceField: 'gallery',
              isArray: true,
              storageMode: 'filename',
              storage: 'local',
              targetField: { keys: 'galleryKeys', urls: 'galleryUrls' },
              typeHint: 'image'
            }
          ]
        }
      }
    }
  }
})
```

## File Validation

### Size Limits

```typescript
validators: {
  maxSizeMB: 10,                    // 10MB max
  allowedMimeTypes: ['image/jpeg'], // Only JPEG
  allowedExtensions: ['.jpg', '.png'] // Only these extensions
}
```

### Image Constraints

```typescript
typeHint: 'image-avatar',  // 128x128 to 4096x4096, ~1:1 aspect ratio
typeHint: 'image-jpg',     // JPEG only, 5MB max
typeHint: 'image-png'      // PNG only, 5MB max
```

## Storage Adapters

### Local Storage

```typescript
CrudmanModule.forRoot({
  fileStorages: {
    local: {
      type: 'local',
      dest: 'uploads',
      publicBaseUrl: 'http://localhost:3000/uploads'
    }
  }
})
```

### S3 Storage

```typescript
CrudmanModule.forRoot({
  fileStorages: {
    s3: {
      type: 's3',
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
})
```

## Testing File Uploads

### Unit Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should upload avatar', async () => {
    const mockReq = {
      body: { name: 'John Doe', email: 'john@example.com' },
      file: { buffer: Buffer.from('fake image data') }
    };

    const result = await controller.create(mockReq);
    
    expect(result.success).toBe(true);
    expect(result.data.avatarKey).toBeDefined();
    expect(result.data.avatarUrl).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('File Uploads (e2e)', () => {
  let app: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should upload avatar image', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .field('name', 'John Doe')
      .field('email', 'john@example.com')
      .attach('avatar', 'test/fixtures/avatar.jpg')
      .expect(201)
      .expect((res) => {
        expect(res.body.data.avatarKey).toBeDefined();
        expect(res.body.data.avatarUrl).toBeDefined();
      });
  });
});
```

## Swagger Documentation

File uploads are automatically documented in Swagger:

- **Request body** shows multipart/form-data option
- **File fields** appear as binary inputs
- **Validation rules** are documented
- **Response schemas** include file URLs

Visit `http://localhost:3000/docs` to see the interactive API documentation.

## Best Practices

1. **Use filename mode** for production (not base64)
2. **Set appropriate size limits** based on use case
3. **Validate file types** to prevent security issues
4. **Use CDN** for public file serving
5. **Implement cleanup** for orphaned files

## Common Use Cases

### User Avatars
```typescript
uploadable: { avatar: 'image-avatar' }
```

### Document Uploads
```typescript
uploadable: { document: 'pdf' }
```

### Image Galleries
```typescript
upload: {
  map: [{
    sourceField: 'images',
    isArray: true,
    storageMode: 'filename',
    targetField: { keys: 'imageKeys', urls: 'imageUrls' },
    typeHint: 'image'
  }]
}
```

## Next Steps

- [Basic CRUD](/docs/guides/basic-crud) - Learn CRUD fundamentals
- [Validations](/docs/guides/validations) - Add validation rules
- [Hooks](/docs/guides/hooks) - Customize behavior
- [Swagger API](/docs/guides/swagger-api) - Generate documentation
