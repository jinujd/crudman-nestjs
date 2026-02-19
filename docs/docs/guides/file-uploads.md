# File Uploads

Handle file uploads with ease using crudman-nestjs's built-in file upload system.

## Quick Start

Enable file uploads with a single configuration:

```typescript
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

This automatically adds:
- `avatarKey: string | null` - File identifier
- `avatarUrl: string | null` - File URL
- File upload handling for the `avatar` field

## Supported File Types

### Images
```typescript
uploadable: { 
  avatar: 'image',           // All image formats
  logo: 'image-jpg',         // JPEG only
  icon: 'image-png',         // PNG only
  profile: 'image-avatar'    // Avatar with size constraints
}
```

### Videos
```typescript
uploadable: { 
  video: 'video',            // All video formats
  clip: 'video-mp4',        // MP4 only
  short: 'video-short'      // Short clips (25MB max)
}
```

### Documents
```typescript
uploadable: { 
  document: 'pdf',           // PDF files
  report: 'doc',            // Office documents
  data: 'spreadsheet'       // Excel/CSV files
}
```

### Archives
```typescript
uploadable: { 
  backup: 'archive',         // ZIP, TAR, etc.
  package: 'binary'         // Any file type
}
```

## Storage Modes

### Filename Mode (Recommended)
Store files via storage adapter, keep only key/URL in entity:

```typescript
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
```

### Direct Field Storage
Store filename directly in entity field:

```typescript
upload: {
  sources: ['multipart'],
  map: [
    {
      sourceField: 'avatar',
      storageMode: 'filename_in_field',
      storage: 'local',
      targetField: 'avatar',
      typeHint: 'image-jpg',
      validators: { maxSizeMB: 2 }
    }
  ]
}
```

### Base64 Storage
Store base64 string in text column:

```typescript
upload: {
  sources: ['base64'],
  map: [
    {
      sourceField: 'thumbnail',
      storageMode: 'base64',
      targetField: 'thumbnailBase64',
      typeHint: 'image'
    }
  ]
}
```

### Blob Storage
Store binary data in BLOB column:

```typescript
upload: {
  sources: ['multipart'],
  map: [
    {
      sourceField: 'file',
      storageMode: 'blob',
      targetField: 'fileData',
      typeHint: 'binary'
    }
  ]
}
```

## Request Formats

### Multipart Form Data
```bash
curl -X POST http://localhost:3000/api/users \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "avatar=@/path/to/image.jpg"
```

### JSON with Base64
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }'
```

## Response Format

File uploads are included in responses with metadata:

```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "avatarKey": "uploads/avatars/1.jpg",
    "avatarUrl": "uploads/avatars/1.jpg"
  },
  "success": true,
  "meta": {
    "baseUrls": {
      "uploads": "http://localhost:3000"
    }
  }
}
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

## Validation Options

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

## Multiple Files

Handle multiple files for the same field:

```typescript
upload: {
  sources: ['multipart'],
  map: [
    {
      sourceField: 'gallery',
      isArray: true,
      storageMode: 'filename',
      storage: 'local',
      targetField: { keys: 'galleryKeys', urls: 'galleryUrls' },
      typeHint: 'image-jpg'
    }
  ]
}
```

## Advanced Configuration

### Per-Action Upload Settings
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
              storage: 's3',
              targetField: { key: 'avatarKey', url: 'avatarUrl' },
              typeHint: 'image-avatar',
              validators: { maxSizeMB: 2 }
            }
          ]
        }
      },
      update: {
        upload: {
          sources: ['multipart'],
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

## Swagger Integration

File uploads are automatically documented in Swagger:

- **Request body** shows multipart/form-data option
- **File fields** appear as binary inputs
- **Validation rules** are documented
- **Response schemas** include file URLs

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

### Thumbnail Generation
```typescript
onAfterAction: async (result, req, ctx) => {
  if (result.data.avatarKey) {
    await ctx.services.imageProcessor.generateThumbnail(result.data.avatarKey)
  }
  return result
}
```

## Next Steps

- [Swagger API](/docs/guides/swagger-api) - Document file uploads
- [Hooks](/docs/guides/hooks) - Customize file processing
- [Advanced Features](/docs/advanced/adapters) - Custom storage adapters
