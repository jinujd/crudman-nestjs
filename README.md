<h1 align="center" style="color:#352D77">crudman-nestjs</h1>

<p align="center">
  <img src="docs/assets/crudman-logo.svg" alt="CRUD Man Logo" width="140" />
  <br/>
<sub style="color:#3F4C70">Minimal, adapter-driven CRUD layer for <strong>NestJS</strong>.</sub>
  <br/>
  <a href="https://jinujd.github.io/crudman-nestjs">Website</a> · <a href="https://github.com/jinujd/crudman-nestjs">GitHub</a>
  <br/>
</p>

> Creating CRUD is so simple. See how a simple States CRUD is defined:

> Note: This is a beta release (version 1.0.1-beta.0). Install with the beta tag:
>
> ```bash
> npm i crudman-nestjs@beta
> ```

```ts
// states.controller.ts
import { Controller } from '@nestjs/common'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { State } from './state.entity'

@UseCrud({ sections: { states: { model: State } } })
@Controller('api/states')
export class StatesController extends CrudControllerBase('states') {}
```

That single snippet gives you:
- GET /api/states (with filters, sorting, pagination, keyword)
- GET /api/states/:id (includes relations by default)
- POST /api/states
- PATCH /api/states/:id
- DELETE /api/states/:id

We believe everyone building RESTful services with NestJS—especially CRUD‑heavy backends—will find this library helpful. It gives you out‑of‑the‑box CRUD endpoints, a clear configuration model, and the freedom to override anything when you need custom behavior. The design centers on adapters (ORM and validator), safe query handling, and simple developer ergonomics so you can start fast and customize when needed.

## Features

- 🔌 Launch-ready CRUD endpoints in minutes
- 🐙 Adapter-first design (TypeORM today; Sequelize-ready) 
- 🔎 Powerful querying: filters, sorting, pagination, keyword search
- 🧭 Relations and attributes control (include/exclude, sensible defaults)
- 🧪 Validation built-in (fastest-validator) and swappable (Joi/Zod adapters)
- 🎬 Elegant overrides via decorators or custom handlers
- 🔧 Minimal config: global options + per-section tuning
- 🎁 Base controller for zero-boilerplate auto routes
- ✏️ Swagger-native with entity-driven schemas and envelopes
- 📦 File uploads: multipart/base64/blob with local/S3 adapters and shorthand
- 🧊 NodeCache per-endpoint caching with smart invalidation
## At-a-glance capabilities

| Capability | What you get |
| --- | --- |
| Auto CRUD endpoints | List, details, create, update, delete with a single decorator or base class |
| PATCH-first updates | Modern partial updates by default (configurable to PUT) |
| Relations by default | Include all relations automatically; refine with include/exclude |
| Attributes selection | All columns by default; include/exclude to shape payloads |
| Powerful querying | Clean filters, sorting, pagination, keyword search with safe whitelists |
| Validation built-in | fastest-validator out of the box; Joi/Zod via adapters |
| Caching | NodeCache per-endpoint with invalidation on writes |
| Hooks | Before/after action, query, validation to extend behavior |
| Swagger enhancer | Auto envelopes for list/details/create/update/delete; entity schemas from metadata |
| Save (upsert) | Single endpoint that creates or updates based on id presence |
| Programmatic calls | Safely call other sections’ actions from hooks/services |

## UseCrud and sections (quick overview)

`UseCrud` is a class decorator that wires your controller to one or more CRUD “sections”. A section is just a named configuration object that points to a model (entity) and optional per-action settings. Each section name becomes the logical key you use in decorators or in the base controller.

- A section maps to a resource (e.g., `users`, `companies`).
- `UseCrud({ sections: { companies: { model: Company, ... } } })` registers the section and its options.
- You then either:
  - Extend `CrudControllerBase('companies')` to get all endpoints for that section automatically, or
  - Use the route decorators like `@CrudList('companies')` to bind specific methods.

Minimal single-section controller (zero handlers):

```ts
import { Controller } from '@nestjs/common'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Company } from './company.entity'

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
export class CompaniesController extends CrudControllerBase('companies') {}
```

Multiple sections in one controller (explicit endpoints):

```ts
import { Controller, Get, Post, Patch, Delete } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete } from 'crudman-nestjs'
import { User } from './user.entity'
import { Company } from './company.entity'

@UseCrud({ sections: { users: { model: User }, companies: { model: Company } } })
@Controller('api')
export class ApiController {
  @Get('users') @CrudList('users') listUsers() {}
  @Get('users/:id') @CrudDetails('users') getUser() {}
  @Post('users') @CrudCreate('users') createUser() {}
  @Patch('users/:id') @CrudUpdate('users') updateUser() {}
  @Delete('users/:id') @CrudDelete('users') deleteUser() {}
}
```

Section options (selected):

```ts
@UseCrud({
  sections: {
    companies: {
      model: Company,
      list: {
        relations: '*',                      // include all relations by default
        attributes: { exclude: ['secret'] }, // all columns except listed
        filtersWhitelist: ['name','isActive','createdAt'],
        additionalSettings: { repo: companyRepository } // TypeORM repo
      },
      details: { relations: ['contacts'], additionalSettings: { repo: companyRepository } },
      create:  { additionalSettings: { repo: companyRepository } },
      update:  { additionalSettings: { repo: companyRepository } },
      delete:  { additionalSettings: { repo: companyRepository } },
    }
  }
})
```

How it links together:

- `UseCrud` stores the sections configuration once on the controller class.
- The library reads that config inside `CrudmanService` and the ORM adapter to resolve repositories, relations, attributes, filters, etc.
- Decorators like `@CrudList('companies')` or the base `CrudControllerBase('companies')` tell the library which section’s settings to apply for a given route.

## Shorthand: UseCrud({ models })

Create CRUD endpoints for multiple models in one controller without writing section objects. This plays nicely with everything else (validation, swagger, caching, relations/attributes, updateMethod, etc.).

Minimal usage (entities):

```ts
@UseCrud({
  models: [User, Company, State],
  defaults: {
    pathStyle: 'kebab',         // 'kebab'|'snake'|'camel'|'pascal'; default 'kebab'
    updateMethod: 'patch',      // override module default if needed
    attributes: { read: '*', write: '*' },
    relations: '*'
  }
})
@Controller('api')
export class ApiController extends CrudControllerBase('*') {} // '*' mounts all sections in this controller
```

Routes generated:
- User → `/api/users`
- Company → `/api/companies`
- State → `/api/states`

Per-model overrides (tuple form):

```ts
@UseCrud({
  models: [
    User,
    [Company, { attributes: { read: { exclude: ['secret'] }, write: { exclude: ['id','createdAt'] } } }],
    [State,   { relations: { include: ['country'] }, filtersWhitelist: ['name','countryId'] }],
  ]
})
@Controller('api')
export class ApiController extends CrudControllerBase('*') {}
```

Per-model overrides (map form):

```ts
@UseCrud({
  models: {
    User: {},
    Company: { attributes: { write: { exclude: ['id','createdAt'] } } },
    State: { relations: { exclude: ['country'] } }
  }
})
```

Model-first (no entity class):

```ts
@UseCrud({
  models: [
    {
      name: 'FeatureFlag',
      fields: {
        key: { type: 'string', primary: true },
        enabled: { type: 'boolean' },
        createdAt: { type: 'date', readonly: true }
      },
      attributes: { read: '*', write: { exclude: ['createdAt'] } },
    }
  ]
})
```

Notes:
- Section/route naming derives from `model.name` (pluralized); can be overridden per model.
- Explicit `sections` and decorator methods always override the shorthand.
- For TypeORM, repositories resolve by entity. For model specs, provide `additionalSettings.repo` or a custom adapter.

## Attributes: read vs write

You can control which fields are returned to clients (read) and which fields clients can send (write). Defaults include all fields `'*'`.

Where to configure:
- Shared: `defaults.attributes` (applied to all actions unless overridden)
- Per action: `list.details.create.update.delete.attributes`

Shapes:
```ts
attributes: {
  read:  '*' | { include?: string[]; exclude?: string[] },
  write: '*' | { include?: string[]; exclude?: string[] }
}
```

Examples:

Return fewer fields in list, allow only safe fields on create:
```ts
list:   { attributes: { read:  { exclude: ['internalNotes'] } } },
create: { attributes: { write: { include: ['name','email','role'] } } }
```

Keep all fields readable, but prevent writes to system fields:
```ts
defaults: { attributes: { read: '*', write: { exclude: ['id','createdAt','updatedAt'] } } }
```

With shorthand models:
```ts
@UseCrud({
  models: [
    [Company, { attributes: { read: { exclude: ['secret'] }, write: { exclude: ['id','createdAt'] } } }]
  ]
})
```

### Attribute inclusion/exclusion examples

Global defaults (apply to all actions unless overridden):

```ts
CrudmanModule.forRoot({
  // keep all fields readable, but protect system fields from writes globally
  defaults: { attributes: { read: '*', write: { exclude: ['id','createdAt','updatedAt'] } } }
})
```

Per-section defaults:

```ts
@UseCrud({ sections: {
  users: {
    model: User,
    // only expose a minimal public profile across list/details
    attributes: { read: { include: ['id','firstName','lastName','avatarUrl'] } }
  }
}})
```

Per-action read narrowing (exclude sensitive columns on list only):

```ts
list:   { attributes: { read: { exclude: ['internalNotes','lastLoginIp'] } } },
details:{ attributes: { read: '*' } }
```

Per-action write allow-list (create allows only safe inputs):

```ts
create: { attributes: { write: { include: ['name','email','role'] } } },
update: { attributes: { write: { exclude: ['id','createdAt','updatedAt'] } } }
```

Combine include/exclude (exclude wins outside include scope):

```ts
attributes: {
  read:  { include: ['id','name','email','profile'], exclude: ['email'] }, // → effectively ['id','name','profile']
  write: { include: ['name','email','role'], exclude: ['role'] }            // → effectively ['name','email']
}
```

Shorthand models (per-model override):

```ts
@UseCrud({
  models: [
    [Company, { attributes: { read: { exclude: ['secret'] }, write: { exclude: ['id','createdAt'] } } }],
    [User,    { attributes: { read: { include: ['id','firstName','lastName','avatarUrl'] } } }]
  ]
})
```

## CrudControllerBase explained

`CrudControllerBase(sectionName: string)` is a tiny base class that auto-binds the five standard routes for a single section:

- `GET /` → list
- `GET /:id` → details
- `POST /` → create
- `PATCH /:id` (default) → update (verb configurable via `updateMethod`)
- `DELETE /:id` → delete

You pass the section name you registered in `UseCrud`:

```ts
@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

This is ideal when one controller maps to one resource (section) and you don’t need custom method bodies. If you later need to override one route, you can add a method and use the decorator variant, e.g.:

```ts
@Get(':id')
@CrudDetails('users')
details(@Req() req) { /* custom logic */ }
```

## File uploads (create/update/save)

CrudMan supports files in requests via a simple, pluggable system. You can accept files as multipart/form-data, base64 strings (in JSON), or even blobs, and choose how they are stored per field.

### Quick start: enable avatar upload in `users` (minimal)

```ts
@UseCrud({ sections: {
  users: {
    model: User,
    common: {
      // one-field image preset → adds avatarKey + avatarUrl columns with filename storage
      uploadable: { avatar: 'image' },
      uploadDefaults: { storage: 'local' }
    }
  }
}})
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

Requests you can send:
- Multipart: form-data with field `avatar` as file
- JSON (base64): `{ "avatar": "data:image/png;base64,iVBORw0..." }`

Entity columns created/expected (filename mode):
- `avatarKey: string | null`, `avatarUrl: string | null`

List response excerpt (avatar URL in data; base URLs under meta):
```json
{
  "data": [{ "id": 1, "name": "Alice", "avatarUrl": "uploads/avatars/1.png" }],
  "success": true,
  "meta": { "baseUrls": { "uploads": "http://localhost:3000" } },
  "pagination": { "page": 1, "perPage": 20 }
}
```

Note: Full image URL = `meta.baseUrls.uploads + '/' + data[i].avatarUrl` → e.g., `http://localhost:3000/uploads/avatars/1.png`.

- Sources: `multipart` (form-data), `base64` (JSON); streams/presigned (advanced)
- Storage modes:
  - `filename` (recommended): upload using a storage adapter (Local/S3/etc.), store only key/filename and optional URL in your entity
  - `base64`: store the base64 string in a text column
  - `blob`: store a Buffer in a BLOB/bytea column, with an adjacent mime column
- Validation: `maxSizeMB`, `allowedMimeTypes`, `allowedExtensions`; shorthands: `image`, `video`, `pdf`, `doc`
- Extras: an optional `extra` field is appended to responses; with shorthand image fields, `imageBases` is auto-populated with public URLs

### Quick start (shorthand)

```ts
@UseCrud({ sections: {
  profiles: {
    model: Profile,
    common: {
      uploadable: { avatar: 'image' },  // → avatarKey + avatarUrl on entity
      uploadDefaults: { storage: 'local' }
    }
  }
}})
```

Request forms:
- Multipart: form-data with field `avatar` as a file
- JSON base64: `{ "avatar": "data:image/png;base64,iVBORw0..." }`

Entity columns for `avatar: 'image'` (filename mode):
- `avatarKey: string | null`, `avatarUrl: string | null`

### Full control (per-action or common)

```ts
sections: {
  documents: {
    model: Doc,
    common: {
      upload: {
        sources: ['multipart','base64'],
        map: [
          { sourceField: 'file', storageMode: 'filename', storage: 's3', targetField: { key: 'fileKey', url: 'fileUrl' }, validators: { maxSizeMB: 10, allowedExtensions: ['.pdf'] }, typeHint: 'pdf' },
          { sourceField: 'thumbnail', storageMode: 'base64', targetField: 'thumbnailBase64', typeHint: 'image' }
        ]
      }
    }
  }
}
```

### Direct-field storage (no keys)

Store the uploaded filename directly into an existing column (no `...Key`/`...Url` fields).

```ts
sections: {
  users: {
    model: User,
    common: {
      upload: {
        sources: ['multipart'],
        map: [
          {
            sourceField: 'avatar',
            storageMode: 'filename_in_field', // write relative filename directly to the target field
            storage: 'local',
            targetField: 'avatar', // your entity must have `avatar: string | null`
            typeHint: 'image-jpg',
            validators: { maxSizeMB: 2 }
          }
        ]
      }
    }
  }
}
``;

Result:
- Multipart field `avatar` → stored via `local` storage → entity `avatar` receives a relative filename (e.g. `uploads/u1/avatar.jpg`).
- No extra key/url columns are created or used.

### Preset examples (image-jpg, image-png, avatar)

```ts
// JPEG only
uploadable: { avatar: 'image-jpg' }

// PNG only
uploadable: { logo: 'image-png' }

// Avatar constraints (min/max dimensions, ~1:1)
uploadable: { avatar: 'image-avatar' }

// Array of images (JPEG)
upload: {
  sources: ['multipart'],
  map: [
    { sourceField: 'gallery', isArray: true, storageMode: 'filename', storage: 'local',
      targetField: { keys: 'galleryKeys', urls: 'galleryUrls' }, typeHint: 'image-jpg' }
  ]
}
```

### Upload options reference

- `uploadable: Record<string, string | string[]>`
  - Shorthand that expands to an `upload.map` entry per field.
  - Value is a preset/typeHint (e.g., `'image' | 'image-jpg' | 'image-png' | 'pdf' | 'doc' | 'video' | ...`).
  - Array value indicates multiple files for that field.
- `upload: { sources?: ('multipart'|'base64')[]; map: UploadMapEntry[] }`
  - `sources`: allowed input sources. Default often `['multipart','base64']` depending on context.
  - `map`: array of rules mapping incoming fields to entity fields.
- `UploadMapEntry` fields:
  - `sourceField: string` (form/base64 field name)
  - `targetField: string | { key?: string; url?: string; keys?: string; urls?: string }`
  - `isArray?: boolean` → multiple files under the same field
  - `storageMode: 'filename' | 'filename_in_field' | 'blob' | 'base64'`
    - `filename`: upload via storage adapter, keep only key/url in entity (recommended)
    - `filename_in_field`: write relative filename directly into a single string column
    - `blob`: store Buffer in a BLOB/bytea column (set `targetField` to the blob column; consider also storing mime)
    - `base64`: keep base64 as text in the target field
  - `storage?: string` → name of a configured storage (e.g., `'local'`, `'s3'`)
  - `typeHint?: string` → preset that sets default validators (e.g., `image`, `image-jpg`, `pdf`)
  - `validators?: { maxSizeMB?: number; allowedMimeTypes?: string[]; allowedExtensions?: string[] }`
  - `sources?: ('multipart'|'base64')[]` → narrow sources per entry

Response notes:
- Create/Update responses include `meta.baseUrls` (when configured) and merged extra metadata.
- Swagger shows three request body tabs (json/form/multipart) by default; file fields appear as binary in multipart.

### Validation and rules
- Uploads are processed into `req.body` first; then your validator runs.
- Shorthands (`image`, `video`, `pdf`, `doc`) infer typical mime/extension allow lists.
- Use `getFinalValidationRules` to merge with or override generated rules.

### Swagger
- Create/Update endpoints are annotated with `multipart/form-data` and normal `application/json`.
- Responses include a `meta` object (non-resource data). For shorthand image fields, responses include `meta.baseUrls` automatically.

## Supported upload types (presets)

Use these presets in `uploadable` (or explicit `upload.map` → `typeHint`) to get sensible defaults for MIME, extensions, and size. All limits are defaults; override with `validators` per field/section. Avatar presets also enforce image dimensions.

| Type                     | Allowed MIME types                                           | Extensions                               | Max size (MB) | Image constraints                                  | Notes |
|--------------------------|--------------------------------------------------------------|------------------------------------------|---------------|----------------------------------------------------|-------|
| image                    | image/jpeg, image/png, image/gif, image/webp, image/avif    | .jpg, .jpeg, .png, .gif, .webp, .avif    | 5             | —                                                  | group |
| image-jpg                | image/jpeg                                                   | .jpg, .jpeg                              | 5             | —                                                  |       |
| image-png                | image/png                                                    | .png                                     | 5             | —                                                  |       |
| image-gif                | image/gif                                                    | .gif                                     | 5             | —                                                  |       |
| image-webp               | image/webp                                                   | .webp                                    | 5             | —                                                  |       |
| image-avif               | image/avif                                                   | .avif                                    | 5             | —                                                  |       |
| image-avatar             | jpeg, png, gif, webp, avif                                   | .jpg, .jpeg, .png, .gif, .webp, .avif    | 2             | min 128x128, max 4096x4096, aspect ~1:1            | avatars |
| image-jpg-avatar         | image/jpeg                                                   | .jpg, .jpeg                              | 2             | min 128x128, max 4096x4096, aspect ~1:1            | avatars |
| image-png-avatar         | image/png                                                    | .png                                     | 2             | min 128x128, max 4096x4096, aspect ~1:1            | avatars |
| image-webp-avatar        | image/webp                                                   | .webp                                    | 2             | min 128x128, max 4096x4096, aspect ~1:1            | avatars |
| image-avif-avatar        | image/avif                                                   | .avif                                    | 2             | min 128x128, max 4096x4096, aspect ~1:1            | avatars |
| video                    | video/mp4, video/webm, video/ogg                             | .mp4, .webm, .ogg                        | 100           | —                                                  |       |
| video-mp4                | video/mp4                                                    | .mp4                                    | 100           | —                                                  |       |
| video-webm               | video/webm                                                   | .webm                                   | 100           | —                                                  |       |
| video-ogg                | video/ogg                                                    | .ogg                                    | 100           | —                                                  |       |
| video-short              | video/mp4, video/webm                                        | .mp4, .webm                              | 25            | —                                                  | short clips |
| audio                    | audio/mpeg, audio/mp4, audio/aac, audio/ogg, audio/wav      | .mp3, .m4a, .aac, .ogg, .wav            | 20            | —                                                  |       |
| pdf                      | —                                                            | .pdf                                    | 10            | —                                                  |       |
| doc                      | —                                                            | .pdf, .doc, .docx, .odt                 | 10            | —                                                  |       |
| spreadsheet              | —                                                            | .xls, .xlsx, .csv                       | 10            | —                                                  | group |
| spreadsheet-csv          | text/csv                                                     | .csv                                    | 5             | —                                                  |       |
| spreadsheet-xls          | application/vnd.ms-excel                                    | .xls                                    | 10            | —                                                  |       |
| spreadsheet-xlsx         | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | .xlsx                              | 10            | —                                                  |       |
| csv                      | text/csv                                                     | .csv                                    | 5             | —                                                  |       |
| xml                      | application/xml, text/xml                                   | .xml                                    | 2             | —                                                  |       |
| html                     | text/html                                                    | .html, .htm                             | 2             | —                                                  |       |
| json                     | application/json                                             | .json                                   | 2             | —                                                  |       |
| text                     | text/plain, text/markdown                                   | .txt, .md                               | 2             | —                                                  |       |
| archive                  | —                                                            | .zip, .tar, .gz, .rar, .7z              | 200           | —                                                  |       |
| binary                   | application/octet-stream                                    | any                                      | 50            | —                                                  | raw blobs |

Notes:
- These are defaults; override with `validators` on each upload rule or via `uploadDefaults.validators`.
- Default storage mode is `filename_in_field` (relative filename saved directly in your entity field).
- By default, list/details include `meta.baseUrls` so clients can build full URLs. Per-request override header: `x-file-url=full|key_only`.

Usage (shorthand):
```ts
@UseCrud({ sections: {
  profiles: {
    model: Profile,
    uploadable: { avatar: 'image-avatar' },
    uploadDefaults: { storage: 'local' } // storage is defined in module forRoot
  }
}})
```

## Overview

crudman-nestjs is a plug-and-play CRUD layer for NestJS. It auto-generates REST endpoints (list, details, create, update, delete) from a simple section config that references your entity model.

- Auto routes: extend `CrudControllerBase('section')` to get CRUD endpoints with zero handler code.
- Decorator overrides: use `@CrudList`, `@CrudDetails`, `@CrudCreate`, `@CrudUpdate`, `@CrudDelete` to customize any endpoint.
- TypeORM-first: works with repositories you provide (in `additionalSettings.repo`). A Sequelize adapter can be added later without changing configs.
- Validation-first: fastest-validator by default; swap validators (Joi/Zod) through a small adapter interface.
- Safe filtering/sorting: allow-list fields to prevent abuse in public endpoints.
- Caching: NodeCache with per-endpoint control and global invalidation on writes.
- OpenAPI-ready: enable/disable swagger globally or per endpoint, pass DTOs to describe `data`.

## Installation

```bash
npm i crudman-nestjs
```

### Zero-config TypeORM DataSource

From v1.0.0+, Crudman auto-discovers your TypeORM `DataSource` at app startup. You no longer need to call `setCrudmanDataSource()` or add a custom provider. If discovery fails in unusual setups, you can still set it manually:

```ts
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'

// e.g., in main.ts after app.init()
const ds = app.get(DataSource)
setCrudmanDataSource(ds)
```

## Swagger Configuration

Crudman automatically generates comprehensive Swagger documentation for all your CRUD endpoints. Here's how to configure it:

### Basic Setup

1. **Install Swagger dependencies** (if not already installed):
```bash
npm install @nestjs/swagger swagger-ui-express
```

2. **Configure Swagger in your main.ts**:
```ts
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { enhanceCrudSwaggerDocument } from 'crudman-nestjs'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle('Your API Title')
    .setVersion('1.0')
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  enhanceCrudSwaggerDocument(document) // This enhances CRUD endpoints
  SwaggerModule.setup('docs', app, document)
  
  await app.listen(3000)
  console.log('Application is running on: http://localhost:3000')
  console.log('Swagger docs available at: http://localhost:3000/docs')
}
bootstrap()
```

3. **Access your API documentation**:
   - **Swagger UI**: `http://localhost:3000/docs`
   - **JSON Schema**: `http://localhost:3000/docs-json`

### What's Auto-Generated

The `enhanceCrudSwaggerDocument()` function automatically adds:

- **Complete API endpoints** for all CRUD operations (GET, POST, PATCH/PUT, DELETE)
- **Request/Response schemas** based on your TypeORM entities
- **Pagination details** for list endpoints
- **Query parameters** (filters, sorting, search, pagination)
- **File upload specifications** for endpoints with file uploads
- **Response envelopes** with proper data structure
- **Validation rules** and error responses

### Request body content types (write endpoints)
- By default, POST/PUT/PATCH show three tabs:
  - `application/json`: inline JSON properties derived from your entity (create: required fields; update: all optional)
  - `application/x-www-form-urlencoded`: same inline properties as form fields
  - `multipart/form-data`: file inputs (when uploads configured) + scalar entity fields
- Relations are excluded from write bodies by default.

You can customize globally via `CrudmanModule.forRoot`:
```ts
CrudmanModule.forRoot({
  swagger: {
    enabled: true,
    // How JSON request body is shown: inline object vs $ref to component schema
    requestBodySchemaMode: 'inline', // 'inline' | 'ref'
    // Which content types to include for write endpoints
    requestBodyContentTypes: ['json','form','multipart'],
    // Include relation properties in write bodies
    includeRelationsInWriteBody: false
  }
})
```

Per-section override:
```ts
@UseCrud({
  sections: {
    companies: {
      model: Company,
      swagger: {
        requestBodySchemaMode: 'inline',
        requestBodyContentTypes: ['json','form'],
        includeRelationsInWriteBody: false
      }
    }
  }
})
```

Notes:
- Inline JSON schema excludes readonly fields (id/createdAt/updatedAt) and upload target fields.
- multipart shows only scalar fields; complex fields are stringified.
- You can use any path for docs (e.g., `'docs'` or `'swagger'`) in `SwaggerModule.setup(path, app, document)`.

### Global Swagger Configuration

You can set global Swagger metadata via the module options:

```ts
CrudmanModule.forRoot({
  swagger: { enabled: true },
  swaggerMeta: { 
    title: 'My Awesome API', 
    version: '2.0.0', 
    description: 'Internal platform APIs' 
  }
})
```

**Defaults** (if not provided):
- title: humanized package.json name (e.g., `crudman-nestjs` → `Crudman Nestjs`)
- version: package.json version (e.g., `1.0.0`)
- description: `CRUD APIs for {title}`

### Export Content Types

Control which response content types are available for list/details via the `x-content-type` header:

```ts
CrudmanModule.forRoot({
  swagger: { enabled: true },
  exportContentTypes: ['json','csv'] // disable excel globally
})
```

The Swagger docs will only show the allowed values in the header enum.

### TypeORM Integration

If you're using TypeORM, make sure to set the DataSource:

```ts
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'

// In your bootstrap function:
const ds = app.get(DataSource)
setCrudmanDataSource(ds)
```

## Quick start (auto routes)

Minimal controller with auto-generated endpoints:
```ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from '../entities/user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

Routes available:
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PATCH /api/users/:id
- DELETE /api/users/:id

To override any one, add your own method and decorate it with `@CrudList`, `@CrudDetails`, etc.

## Module registration

Register the module once with sensible defaults:
```ts
import { Module } from '@nestjs/common';
import { CrudmanModule, defaultResponseFormatter } from 'crudman-nestjs';

@Module({
  imports: [
    CrudmanModule.forRoot({
      swagger: { enabled: true },
      cache: { enabled: true, stdTTL: 60, checkperiod: 120, invalidateListsOnWrite: true },
      defaultResponseFormatter,
      identityAccessor: (req) => req.identity || req.user || {},
      roleChecker: (identity, roles) => !roles?.length || roles.includes(identity?.role),
      // HTTP verb for update endpoints: default 'patch'. Set to 'put' to use PUT.
      updateMethod: 'patch',
      // defaultOrm, defaultValidator can be supplied to replace built-ins
    }),
  ],
})
export class AppModule {}
```

Parameters (forRoot):
- swagger.enabled: boolean. Enables swagger decorators by default. You can disable per endpoint in decorator options.
- cache: { enabled, stdTTL, checkperiod, maxKeys?, invalidateListsOnWrite }
  - enabled: turn on/off NodeCache integration.
  - stdTTL: default TTL (seconds).
  - checkperiod: cache cleanup interval (seconds).
  - invalidateListsOnWrite: when true, writes will invalidate list caches globally.
- defaultResponseFormatter: function to shape API responses (see Response formatter).
- identityAccessor(req): returns `{ id, role, merchant_id? }` extracted from request.
- roleChecker(identity, roles): returns boolean; simple role check logic.
- defaultOrm: override the default ORM adapter (e.g., custom TypeORM adapter).
- defaultValidator: override the validator adapter (e.g., Joi).

## Section config

Minimal:
```ts
{ model: User }
```

Expanded (TypeORM example):
```ts
{
  model: User,
  list: {
    relations: ['profile'],
    getRelations: async (req) => (req.query.withRoles ? ['profile','roles'] : ['profile']),
    filtersWhitelist: ['email','createdAt','role'],
    sortingWhitelist: ['createdAt','email'],
    orderBy: [['createdAt','DESC']],
    onBeforeQuery: async (opts) => {
      // opts is a TypeORM FindManyOptions-like object
      opts.where = { ...(opts.where||{}), isActive: true }
      return opts
    },
    onBeforeValidate: async (req, res, rules, validator) => true,
    onAfterValidate: async (req, res, errors, validator) => true,
    enableCache: { ttl: 60 },
    additionalSettings: { repo: userRepository }, // your TypeORM repository
  },
  details: { relations: ['profile'], enableCache: true, additionalSettings: { repo: userRepository } },
  create: { fieldsForUniquenessValidation: ['email'], additionalSettings: { repo: userRepository } },
  update: { fieldsForUniquenessValidation: ['email'], additionalSettings: { repo: userRepository } },
  delete: { additionalSettings: { repo: userRepository } },
  requiredRoles: ['admin'],
  ownership: { field: 'user_id' },
}
```

Keys (per action, unless noted):
- model (required): Entity class.
- relations (optional): '*' | string[] | { include?: string[]; exclude?: string[] }.
- getRelations(req,res,cfg) (optional): Promise<string[] | { include?: string[]; exclude?: string[] } | '*' | undefined> | (string[] | { include?: string[]; exclude?: string[] } | '*' | undefined).
  - Semantics:
    - '*' → include all relations by default.
    - string[] → include only the listed relations.
    - { include } → include only the listed relations.
    - { exclude } → include all except the listed relations.
- filtersWhitelist (optional): string[]. If not provided, all entity columns are allowed (derived from repository metadata).
- sortingWhitelist (optional): string[]. If not provided, all entity columns are allowed (derived from repository metadata).
- orderBy (optional): Array<[field, "ASC"|"DESC"]>.
- recordSelectionField (optional): string, default "id".
- fieldsForUniquenessValidation (optional): string[].
- conditionTypeForUniquenessValidation (optional): "or"|"and".
- hooks (optional): onBeforeAction, onAfterAction, onBeforeQuery, afterFetch, onBeforeValidate, onAfterValidate.
- additionalResponse (optional): object or function `(req, res, currentResponse) => object` whose returned properties are merged into the response `meta`.
- getAdditionalResponse (optional): function `(req, res, currentResponse) => object | Promise<object>`; evaluated after `additionalResponse` and merged into the same `meta`.
- getFinalValidationRules(generatedRules, req, res, validator) (optional): returns new rules.
- enableCache (optional): boolean | { ttl?: number; key?:(ctx)=>string }.
- additionalSettings.repo (required for TypeORM adapter): repository instance.
 - attributes (optional): '*' | string[] | { include?: string[]; exclude?: string[] }. Defaults to all columns. Narrow for performance or privacy.
   - Semantics:
     - '*' → include all columns by default.
     - string[] → include only the listed columns.
     - { include } → include only the listed columns.
     - { exclude } → include all except the listed columns.

Parameter details:
- model (required)
  - Type: Entity class (TypeORM). Used to infer validation rules and as a semantic marker for the section.
- relations (optional)
  - Type: string[] (e.g., ['profile','roles']). Included in list/details queries for joins and field selection.
  - Tip: Only add relations you need; over-joining impacts performance.
- getRelations(req,res,cfg) (optional)
  - Type: (req, res, cfg) => Promise<string[]> | string[]
  - Use: Compute relations dynamically (e.g., ?withRoles=1). Return an array merged with static relations.
- filtersWhitelist (optional)
  - Type: string[] of root entity fields allowed for request-driven filtering (e.g., 'status', 'createdAt.min').
  - Default: all root columns, derived from repository metadata.
  - Use: Restrict for public endpoints to avoid unexpected filters.
- sortingWhitelist (optional)
  - Type: string[] of root entity fields allowed for request-driven sorting (?sort.field=asc|desc).
  - Default: all root columns, derived from repository metadata.
  - Use: Restrict for public endpoints to avoid expensive sorts.
- orderBy (optional)
  - Type: Array<[field, 'ASC'|'DESC']>
  - Use: Default ordering when the request does not specify any sort.
- recordSelectionField (optional)
  - Type: string; default 'id'.
  - Use: The logical identifier used by details/update/delete/save to select a record.
    - details: reads from `req.params[recordSelectionField]`.
    - update/delete: reads from `req.params[recordSelectionField]`.
    - save (upsert): if `recordSelectionField` exists in `req.params` or `req.body`, it behaves like update; otherwise create.
  - Examples:
    - Use 'slug' to address records by slug: GET /posts/:slug → details uses slug.
    - Use composite behavior by mapping external ids into body/params before calling save.
  - Recommendation: back the selection field with an index/unique constraint for fast lookups.
- fieldsForUniquenessValidation (optional)
  - Type: string[]; fields checked for uniqueness during create/update/save.
  - Use: The service composes OR/AND conditions (see next) and rejects when duplicates exist.
- conditionTypeForUniquenessValidation (optional)
  - Type: 'or'|'and'; default 'or'.
  - Use: Controls whether multiple uniqueness fields must be unique together ('and') or any of them ('or').
  
Uniqueness behavior:
- By default, no uniqueness is enforced unless you specify `fieldsForUniquenessValidation` (per section or per action).
- On create: checks if a record exists matching the field(s). If found, returns fastest-validator style errors: `{ type: 'unique', field, message: '<field> must be unique' }` with HTTP 400.
- On update: same, but excludes the current record by primary key (uses `recordSelectionField` when provided, fallback `id`).
- Override per action: set `fieldsForUniquenessValidation` and optionally `conditionTypeForUniquenessValidation`.

Example (section):
```ts
export function companiesSection(repo: Repository<Company>) {
  return {
    model: Company,
    create: { fieldsForUniquenessValidation: ['name'], additionalSettings: { repo } },
    update: { fieldsForUniquenessValidation: ['name'], additionalSettings: { repo } },
  }
}
```

### Unique validation (create/update/save)

Configure server-side uniqueness checks without requiring DB-level unique constraints. Works with TypeORM adapter via repository lookups.

Basic: make `slug` unique (even if DB column isn’t unique):
```ts
@UseCrud({
  sections: {
    posts: {
      model: Post,
      create: { fieldsForUniquenessValidation: ['slug'] },
      update: { fieldsForUniquenessValidation: ['slug'] }
    }
  }
})
```

Multiple unique fields (default OR semantics: error if any duplicates):
```ts
create: { fieldsForUniquenessValidation: ['email','username'] },
update: { fieldsForUniquenessValidation: ['email','username'] }
```

Compound uniqueness (AND semantics: the pair must be unique together):
```ts
create: {
  fieldsForUniquenessValidation: ['tenantId','slug'],
  conditionTypeForUniquenessValidation: 'and'
},
update: {
  fieldsForUniquenessValidation: ['tenantId','slug'],
  conditionTypeForUniquenessValidation: 'and'
}
```

Per-action override (e.g., enforce only on create):
```ts
create: { fieldsForUniquenessValidation: ['slug'] },
update: { /* no uniqueness */ }
```

Update behavior:
- The check automatically excludes the current record using the primary key. If you update a record but keep the same `slug`, no error is raised. Changing `slug` to a value used by a different record returns 400 with `{ type: 'unique', field: 'slug', message: 'slug must be unique' }`.
- hooks (optional)
  - onBeforeAction(req,res,service): early allow/deny; return false to abort.
  - onAfterAction(result,req,service): mutate/replace formatted response before sending/caching.
  - onBeforeQuery(opts, model, req, res, service): adjust TypeORM find options; return modified options.
  - afterFetch(data, req, res, service): transform DB results before formatting.
  - onBeforeValidate(req, res, rules, validator, service): adjust rules or return false to abort.
  - onAfterValidate(req, res, errors, validator, service): return false to abort when custom checks fail.
- getFinalValidationRules(generatedRules, req, res, validator) (optional)
  - Type: function returning final rules/schema.
  - Use: Replace/extend auto-generated rules from the model (e.g., add Joi/Zod/fastest-validator constraints).
- enableCache (optional)
  - Type: boolean | { ttl?: number; key?:(ctx)=>string }.
  - Use: Per-action toggle; when enabled for list/details, read-through cache is applied; writes invalidate list cache globally if configured.
- additionalSettings.repo (TypeORM adapter)
  - Type: Repository instance used for list/details/create/update/delete/save.
  - Required for TypeORM operations; supply the correct repository per section/action.

Default relations/attributes behavior:
- Relations default to all entity relations (`relations: '*'`). Use `relations: { exclude: [...] }` to drop heavy joins or `relations: ['relA','relB']` to be explicit.
- You can also use `relations: { include: ['relA','relB'] }` to include only specific relations.
- Attributes default to all columns. Use `attributes: { exclude: [...] }` or an explicit list to narrow select.
- You can also use `attributes: { include: ['id','name'] }` (or `['id','name']`) to include only specific columns.
- When `filtersWhitelist` or `sortingWhitelist` are omitted, the library resolves allowed fields from the TypeORM repository’s columns (`repo.metadata.columns`). This enables filter/sort on all fields by default while staying strictly model-scoped.

Keyword search (list):
- Query param: `keyword` (rename via `keywordParamName`).
- Config under the list action:
  - `keyword.isEnabled?: boolean` (default true)
  - `keyword.isCaseSensitive?: boolean` (default false → case-insensitive)
  - `keyword.minLength?: number` (default 2)
  - `keyword.searchableFields?: string[]` – dot paths like `['name','user.name','user.profile.email']` (max 3 levels). If omitted, all root columns are searched.
  - `keyword.maxRelationDepth?: 1|2|3` (default 1) – cap relation depth when using dot paths or metadata discovery.

Behavior:
- If `keyword` provided and passes `minLength`, the adapter adds a single OR group of LIKE conditions across the selected fields.
- For nested dot paths, required relations are merged into `relations` to enable searching joined targets.
- Case-insensitive search uses a LOWER/ILIKE intent; behavior may vary by database.

Example:
```ts
list: {
  keyword: {
    searchableFields: ['name','contacts.email','contacts.address.city'],
    minLength: 2,
    caseSensitive: false,
    maxRelationDepth: 2,
  },
  additionalSettings: { repo: companyRepository }
}
```

## Response formatter (simple and overridable)

The library builds a standard envelope and lets you override it globally or per action.

Default for list:
```json
{
  "data": [],
  "errors": [],
  "success": true,
  "pagination": { "page": 1, "perPage": 20, "totalPagesCount": 0, "totalItemsCount": 0, "isHavingNextPage": false, "isHavingPreviousPage": false },
  "filters": [],
  "sorting": []
}
```

Default for details/create/update/delete/save:
```json
{ "data": {}, "errors": [], "success": true }
```

- list: `data` is an array. Includes `pagination`, `filters`, `sorting`.
- details: `data` is an object or null.
- create/update/save: `data` is the saved entity (object).
- delete: `data` has a small message object by default.

Override globally:
```ts
CrudmanModule.forRoot({ defaultResponseFormatter: ({ action, payload, errors, success, meta }) => ({
  action,
  ok: success,
  result: payload,
  pageInfo: meta?.pagination,
}) })
```

Override per action (section config):
```ts
list: {
  responseHandler: (result) => ({ items: result.data, ok: result.success })
}
```

## Hooks (what, when, why)

All hooks are optional and async-capable.

### onBeforeAction(req, res, service)
- Type: `(req: RequestLike, res: ResponseLike, service: CrudmanService) => boolean | void | Promise<boolean | void>`
- Use: Run before doing the action (list/details/create/update/save/delete). Return `false` to abort (block access early).
- Returns: `false` to stop; anything else continues.
- Example:
```ts
onBeforeAction: async (req) => {
  if (!req.identity?.id) return false // block anonymous
}
```

Restrict a list to the logged-in user’s company (inject condition before the query):
```ts
// In the users section
list: {
  filtersWhitelist: ['companyId','email','createdAt'],
  onBeforeAction: async (req) => {
    // Assume req.identity is populated by your auth middleware/guard
    const companyId = req.identity?.companyId
    if (!companyId) return false // no company → block
    // Inject an equals filter so only users from this company are listed
    req.query = req.query || {}
    req.query.companyId = String(companyId)
    return true
  }
}
```
Notes:
- Ensure the field you inject (e.g., `companyId`) is present in `filtersWhitelist` for the list action.
- You can alternatively implement this with `onBeforeQuery` to modify ORM options directly.
Blocking access early means: the action will not hit the database or do any work; the service simply stops. You can also send a response yourself:
```ts
onBeforeAction: async (req, res) => {
  if (!req.identity) {
    res?.send?.({ success: false, errors: [{ message: 'Unauthorized' }] })
    return false
  }
  return true // proceed normally
}
```
If you return `true` (or nothing), the action proceeds. If you return `false`, nothing else runs for that request.

### onAfterAction(result, req, service)
- Type: `(result: any, req: RequestLike, service: CrudmanService) => any | void | Promise<any | void>`
- Use: Mutate or replace the formatted response just before sending.
- Returns: Return a new result to replace, or nothing to keep the original.
- Example:
```ts
onAfterAction: async (result) => ({ ...result, servedAt: new Date().toISOString() })
```
You can also add metadata per action or enforce a common envelope:
```ts
onAfterAction: (result, req) => ({
  requestId: req.headers?.['x-request-id'] || null,
  ...result
})
```

### onBeforeQuery(builderOrOpts, model, req, res, service)
- Type: `(builderOrOpts: FindOptionsLike | QueryBuilderLike, model: any, req: RequestLike, res: ResponseLike, service: CrudmanService) => any | Promise<any>`
- Use: Modify repository find options (TypeORM) before executing DB call.
- Returns: The modified options/builder.
- Example (TypeORM FindOptions):
```ts
onBeforeQuery: async (opts) => {
  opts.where = { ...(opts.where||{}), isActive: true }
  return opts
}
```
Other common examples:
```ts
// Add tenant scoping
onBeforeQuery: async (opts, _model, req) => {
  const tenantId = req.identity?.merchant_id
  if (tenantId) opts.where = { ...(opts.where||{}), merchant_id: tenantId }
  return opts
}

// Force a default order when none is provided
onBeforeQuery: async (opts) => {
  opts.order = opts.order || { createdAt: 'DESC' }
  return opts
}

// Narrow selected fields for performance
onBeforeQuery: async (opts) => {
  if (!opts.select) opts.select = ['id','email','createdAt']
  return opts
}
```

### afterFetch(data, req, res, service)
- Type: `(data: any[] | any, req: RequestLike, res: ResponseLike, service: CrudmanService) => any[] | any | Promise<any[] | any>`
- Use: Transform DB results after fetch but before formatting.
- Returns: Transformed array/object.
- Example:
```ts
afterFetch: async (items) => Array.isArray(items) ? items.map(i => ({ ...i, tag: 'USER' })) : { ...items, tag: 'USER' }
```

### onBeforeValidate(req, res, rules, validator, service)
- Type: `(req: RequestLike, res: ResponseLike, rules: any, validator: ValidatorAdapter, service: CrudmanService) => boolean | void | Promise<boolean | void>`
- Use: Adjust rules just before validation runs.
- Returns: `false` to abort validation/action.
- Example:
```ts
onBeforeValidate: async (req, _res, rules) => {
  rules.email = { type: 'email', empty: false }
  return true
}
```

### getFinalValidationRules(generatedRules, req, res, validator)
- Type: `(generatedRules: any, req: RequestLike, res: ResponseLike, validator: ValidatorAdapter) => any | Promise<any>`
- Use: Replace or extend the auto-generated rules from the model.
- Returns: The final rules object/schema used for validation.
- Rules format: fastest-validator schema. Use fields like `type`, `min`, `max`, `empty`, `optional`, `enum`, etc.

Examples:

1) Make fields mandatory on create but optional on update (fastest-validator format):
```ts
// Create action: name and email required; phone optional
create: {
  getFinalValidationRules: (rules) => ({
  ...rules,
    name:  { type: 'string', empty: false, min: 2 },
    email: { type: 'email',  empty: false },
    phone: { type: 'string', optional: true }
  })
},

// Update action: make all fields optional, but keep formats
update: {
  getFinalValidationRules: (rules) => ({
    ...rules,
    name:  { type: 'string', min: 2, optional: true },
    email: { type: 'email',  optional: true },
    phone: { type: 'string', optional: true }
  })
}
```

2) Add a password rule (min length) while keeping generated rules:
```ts
getFinalValidationRules: (rules) => ({
  ...rules,
  password: { type: 'string', min: 8, empty: false }
})
```

### onAfterValidate(req, res, errors, validator, service)
- Type: `(req: RequestLike, res: ResponseLike, errors: any[], validator: ValidatorAdapter, service: CrudmanService) => boolean | void | Promise<boolean | void>`
- Use: Inspect validation errors and stop flow on custom conditions.
- Returns: `false` to abort when errors exist.
- Example:
```ts
onAfterValidate: async (_req, _res, errors) => {
  if (errors.length) return false
  return true
}
```

Type aliases used above (pseudo):
```ts
type RequestLike = { params?: any; query?: any; body?: any; identity?: any }
type ResponseLike = { headersSent?: boolean; send?: (body: any) => void }
interface FindOptionsLike { where?: any; relations?: string[]; order?: any; skip?: number; take?: number; select?: any }
interface QueryBuilderLike { andWhere?: Function; leftJoinAndSelect?: Function; orderBy?: Function }
```

### Execution order of hooks

The exact order depends on the action. The library also integrates caching on list/details.

- List
  1) onBeforeAction
  2) Resolve relations (relations/getRelations)
  3) Cache check (if enabled) – returns cached result if present
  4) onBeforeQuery (modify find options)
  5) DB fetch (repo.findAndCount)
  6) afterFetch (transform items)
  7) Format response (defaultResponseFormatter or responseHandler)
  8) onAfterAction (last chance to mutate response)
  9) Store in cache (if enabled)
  10) Send response

- Details
  1) onBeforeAction
  2) Resolve relations (relations/getRelations)
  3) Cache check (if enabled) – returns cached result if present
  4) onBeforeQuery (modify find options)
  5) DB fetch (repo.findOne)
  6) afterFetch (transform entity)
  7) Format response
  8) onAfterAction
  9) Store in cache (if enabled)
  10) Send response

- Create / Update / Save
  1) onBeforeAction
  2) Generate validation rules from model
  3) getFinalValidationRules (override/extend rules)
  4) onBeforeValidate (mutate rules or abort)
  5) Validate
  6) onAfterValidate (abort if custom checks fail)
  7) DB write (create/update/save)
  8) Format response
  9) onAfterAction
  10) Invalidate list cache (if configured)
  11) Send response

- Delete
  1) onBeforeAction
  2) DB delete
  3) Format response
  4) onAfterAction
  5) Invalidate list cache (if configured)
  6) Send response

Notes:
- onBeforeAction runs before any cache lookup; you can block access early.
- onAfterAction runs after formatting; if you return a new object, it replaces the final response (and is what gets cached for list/details).
- onBeforeQuery always receives the current ORM find options (TypeORM style) and should return them.

## Decorator-driven overrides
```ts
import { Controller, Get } from '@nestjs/common';
import { UseCrud, CrudList } from 'crudman-nestjs';
import { User } from '../entities/user.entity';
import { UserDto } from '../dtos/user.dto';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {
  @Get()
  @CrudList('users', { swagger: { enabled: true }, dto: UserDto })
  list() {}
}
```

## Multiple sections in the same controller
When you need multiple sections (e.g., `users` and `posts`) handled by one controller, use the decorator-driven pattern and give each route its own path. The auto-route base (`CrudControllerBase`) is single-section by design.

```ts
import { Controller, Get, Post, Put, Delete } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete } from 'crudman-nestjs'
import { User } from '../entities/user.entity'
import { Post as BlogPost } from '../entities/post.entity'

@UseCrud({
  sections: {
    users: { model: User },
    posts: { model: BlogPost }
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

  @Put('users/:id')
  @CrudUpdate('users')
  updateUser() {}

  @Delete('users/:id')
  @CrudDelete('users')
  deleteUser() {}

  // Posts endpoints
  @Get('posts')
  @CrudList('posts')
  listPosts() {}

  @Get('posts/:id')
  @CrudDetails('posts')
  getPost() {}

  @Post('posts')
  @CrudCreate('posts')
  createPost() {}

  @Put('posts/:id')
  @CrudUpdate('posts')
  updatePost() {}

  @Delete('posts/:id')
  @CrudDelete('posts')
  deletePost() {}
}
```

## Organizing sections in separate files
For better organization, keep each section’s configuration in its own file under a `crud/` directory. Import and compose sections in your controllers (or a factory/provider) instead of inlining all the config.

### Suggested structure
```text
src/
  crud/
    users.section.ts
    companies.section.ts
  controllers/
    api.controller.ts
  entities/
    user.entity.ts
    company.entity.ts
```

### users.section.ts (example)
```ts
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'

export function usersSection(userRepository: Repository<User>) {
  return {
    model: User,
    list: {
      filtersWhitelist: ['email','createdAt','role'],
      sortingWhitelist: ['createdAt','email'],
      additionalSettings: { repo: userRepository },
      keyword: { searchableFields: ['firstName','lastName','email'] }
    },
    details: { additionalSettings: { repo: userRepository } },
    create: { additionalSettings: { repo: userRepository } },
    update: { additionalSettings: { repo: userRepository } },
    delete: { additionalSettings: { repo: userRepository } },
  }
}
```

### companies.section.ts (example)
```ts
import { Repository } from 'typeorm'
import { Company } from '../entities/company.entity'

export function companiesSection(companyRepository: Repository<Company>) {
  return {
    model: Company,
    list: {
      filtersWhitelist: ['name','isActive','createdAt'],
      sortingWhitelist: ['createdAt','name'],
      additionalSettings: { repo: companyRepository },
      keyword: { searchableFields: ['name','contacts.email','contacts.address.city'], maxRelationDepth: 2 }
    },
    details: { additionalSettings: { repo: companyRepository } },
    create: { additionalSettings: { repo: companyRepository } },
    update: { additionalSettings: { repo: companyRepository } },
    delete: { additionalSettings: { repo: companyRepository } },
  }
}
```

### Using the sections
```ts
import { Controller, Get } from '@nestjs/common'
import { UseCrud, CrudList } from 'crudman-nestjs'
import { usersSection } from '../crud/users.section'
import { companiesSection } from '../crud/companies.section'

// Assume you obtain repositories from your DI/container or a factory
const sections = {
  users: usersSection(userRepository),
  companies: companiesSection(companyRepository),
}

@UseCrud({ sections })
@Controller('api')
export class ApiController {
  @Get('users') @CrudList('users') listUsers() {}
  @Get('companies') @CrudList('companies') listCompanies() {}
}
```

### Why this helps
- Clear separation of concerns: each domain’s CRUD config lives next to its entity logic.
- Reusability: import the same section into multiple controllers or modules.
- Scalability: large apps avoid monolithic controller files.
- Testability: unit-test section configs (hooks, rules) in isolation.
- Discoverability: IDE-friendly navigation; simpler diffs and code reviews.
- Flexibility: easy to swap repositories, adapters, or hook behaviors per section.

## Caching
- NodeCache is used by default. Configure at module level and per action (`enableCache`).
- Writes invalidate cached lists by default (configurable with `invalidateListsOnWrite`).

## Swagger / OpenAPI
- Enabled globally via `forRoot({ swagger: { enabled: true } })` or disable per endpoint in decorator options.
- Provide a DTO per endpoint to type `data` for the docs, or rely on entity-driven schemas described below.

### Auto-generate schemas and envelopes from entities (optional)
You can auto-generate OpenAPI schemas for your entities and have list/details/create/update/delete responses documented with the standard envelope automatically.

```ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { enhanceCrudSwaggerDocument, generateOpenApiSchemaFromEntity } from 'crudman-nestjs'
import { Company } from './company.entity'
import { User } from './user.entity'

const app = await NestFactory.create(AppModule)
// ... setCrudmanDataSource(app.get(DataSource)) ...

const swagger = require('@nestjs/swagger')
const config = new DocumentBuilder().setTitle('Example').setVersion('1.0').build()
const doc = SwaggerModule.createDocument(app, config)
// Optionally pre-register component schemas (enhancer also derives them from @UseCrud sections)
doc.components = doc.components || { schemas: {} }
doc.components.schemas = {
  ...doc.components.schemas,
    Company: generateOpenApiSchemaFromEntity(Company)!,
    User: generateOpenApiSchemaFromEntity(User)!
  }
// Enhance: add list/detail/create/update/delete response envelopes and entity refs
enhanceCrudSwaggerDocument(doc)
SwaggerModule.setup('docs', app, doc)
```

### Import / Export

- Export via x-content-type:
  - Set header `x-content-type: csv` on list or details GET to receive CSV.
  - For list, only the `data` array is included in CSV. Pagination/meta are provided in response headers:
    - `X-Pagination-Total`, `X-Pagination-Page`, `X-Pagination-PerPage`, `X-Filters`, `X-Sorting`.
  - Default when header not provided: JSON.

Example (cURL):
```bash
curl -H "x-content-type: csv" -i "http://localhost:3001/api/states"
# Look at headers for pagination/meta and body for CSV rows
```

Optional Excel (.xlsx):
- Install at app level: `npm i exceljs`
- Request with `x-content-type: excel` to download an .xlsx file.
- If not installed, the API responds with a JSON error explaining to install `exceljs`.

- Bulk operations (preview):
  - `POST /{section}/bulk/import` – accepts JSON array or CSV (when `x-content-type: csv`). Options include:
    - `recordSelectionField` (default from section or `id`)
    - `policy`: `upsert` (default) | `insert_only` | `update_only` | `ignore_on_conflict` | `replace`
    - `batchSize`, `dryRun`, `stopOnError`
  - `POST /{section}/bulk/delete` – accepts `{ ids: [] }` JSON or CSV list of ids.
  - Responses include summary `{ inserted, updated, deleted, skipped, errorsCount }` and per-row CSV (when requested).

Swagger header parameter:
- `x-content-type` enum: `json` (default), `csv`, `excel` (optional/if enabled).

Notes:
- Schemas reflect entity column types, `nullable`, and length (maxLength).
- For full control, DTOs still work and take precedence when provided on endpoints.

## Swapping adapters
- ORM: default TypeORM adapter; a Sequelize adapter can be added later with same config keys.
- Validator: default fastest-validator; later swap in Joi via `ValidatorAdapter`.

## Testing
- Vitest tests included for utils, formatter, validator, and ORM adapter.

## License
MIT

---

## Example: Simple Companies CRUD (TypeORM)

This end-to-end example shows a minimal TypeORM entity, plus how to configure the CRUD.

### 1) TypeORM entity
```ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ length: 120 })
  name!: string

  @Column({ nullable: true })
  website?: string | null

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn()
  createdAt!: Date
}
```

### 2) Section configuration (TypeORM repositories)

For the TypeORM adapter, provide the repository via `additionalSettings.repo` for each action.

```ts
import { Repository } from 'typeorm'
import { Company } from './company.entity'

export function buildCompaniesSection(companyRepository: Repository<Company>) {
  return {
    model: Company,
    list: {
      filtersWhitelist: ['name', 'createdAt', 'isActive'],
      sortingWhitelist: ['createdAt', 'name'],
      orderBy: [['createdAt', 'DESC']],
      enableCache: { ttl: 60 },
      additionalSettings: { repo: companyRepository },
      // Optional hooks
      onBeforeQuery: async (opts) => {
        // Only active companies by default
        opts.where = { ...(opts.where || {}), isActive: true }
        return opts
      },
      afterFetch: async (items) => items,
    },
    details: { additionalSettings: { repo: companyRepository } },
    create: {
      additionalSettings: { repo: companyRepository },
      getFinalValidationRules: (rules) => ({
        ...rules,
        name: { type: 'string', min: 2, max: 120 },
        website: { type: 'string', optional: true }
      })
    },
    update: {
      additionalSettings: { repo: companyRepository },
      getFinalValidationRules: (rules) => ({
        ...rules,
        name: { type: 'string', min: 2, max: 120, optional: true },
        website: { type: 'string', optional: true }
      })
    },
    delete: { additionalSettings: { repo: companyRepository } },
  }
}
```

### 3) Controller options

You can use either auto routes via the base controller (single section) or multiple sections with decorators.

Single-section auto routes:
```ts
import { Controller } from '@nestjs/common'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Company } from './company.entity'

// Note: you need to make sure buildCompaniesSection(...) is called with a repository
// at app composition time. One common approach is to export a constant that holds the
// built section using a repository created outside DI, or to prefer the decorator pattern below.

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
export class CompaniesController extends CrudControllerBase('companies') {}
```

Multiple sections in one controller (recommended when you need to wire repositories explicitly):
```ts
import { Controller, Get, Post, Put, Delete } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails, CrudCreate, CrudUpdate, CrudDelete } from 'crudman-nestjs'
import { Company } from './company.entity'

@UseCrud({
  sections: {
    // model is used for rule generation; repository is provided via additionalSettings.repo
    companies: { model: Company }
  }
})
@Controller('api')
export class ApiController {
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

Notes:
- In the TypeORM adapter, `additionalSettings.repo` is required on each action to perform DB operations.
- Keep filters/sorting whitelists strict for public endpoints.
- Use `getFinalValidationRules` to strengthen auto-generated rules from your entity.

### Adding extra response data (additionalResponse / getAdditionalResponse)

You can attach custom metadata to any action's response without changing the envelope. Provide either a static object via `additionalResponse`, or compute it dynamically via `getAdditionalResponse`. Both are merged into the response `meta`.

Example (per action):

```ts
create: {
  additionalSettings: { repo: companyRepository },
  additionalResponse: { servedBy: 'crudman' },
  getAdditionalResponse: async (req, _res, current) => ({
    requestId: req.headers['x-request-id'] || null,
    timestamp: new Date().toISOString(),
    // you can inspect current (already formatted) response if needed
  })
}
```

Response shape (excerpt):

```json
{
  "data": { /* ... */ },
  "success": true,
  "meta": {
    "servedBy": "crudman",
    "requestId": "abc-123",
    "timestamp": "2025-09-20T20:34:00.000Z"
  }
}
```

Example (example app excerpt): see `examples/nest-typeorm-sqlite/src/crud/companies.section.ts`:

```ts
export function companiesSection() {
  return {
    model: Company,
    list: {
      additionalResponse: { servedBy: 'example-app' },
      getAdditionalResponse: async (req) => ({ requestId: req.headers?.['x-request-id'] || null })
    },
    create: {
      getAdditionalResponse: async () => ({ createdVia: 'companies-section' })
    }
  }
}
```

Defaults: If neither `additionalResponse` nor `getAdditionalResponse` is provided, no extra `meta` properties are added (beyond system-provided ones like pagination/filters/sorting when applicable).

### Query parameters: filters, sorting, pagination (Companies)

Supported filters (root fields):
- Equals: `field=value`
- Like (substring): `field.like=value`
- Numeric/Date ranges: `field.min=value`, `field.max=value`, `field.gt=value`, `field.lt=value`
- Between (date/number): `field.between=start,end` (encode comma if needed: `%2C`)

#### Filters quick reference
```text
# Equals
?name=Acme

# Like (substring, case-insensitive)
?name.like=acme

# Numeric/date range shortcuts
?age.min=18
?age.max=65
?price.gt=100
?price.lt=500

# Between (dates or numbers)
?createdAt.between=2024-01-01,2024-01-31
```
Notes:
- Field names are camelCase by default; snake_case aliases are also accepted and normalized.
- Filters apply only to whitelisted fields (`filtersWhitelist`), or all entity columns if a whitelist isn’t provided.

Sorting:
- `sort.field=asc|desc` (repeat for multi-sort)

Pagination:
- `page`, `per_page`

Keyword search (if configured):
- `keyword=substring` (searches configured `searchableFields`, supports nested dot-paths)

Examples:
```text
# Active companies only
GET /api/companies?isActive=1

# Name contains "air" (case-insensitive), most recent first
GET /api/companies?name.like=air&sort.createdAt=desc

# Created between two dates
GET /api/companies?createdAt.between=2024-01-01,2024-01-31

# Created from Jan to Dec (inclusive), page 2, 20 per page
GET /api/companies?createdAt.min=2024-01-01&createdAt.max=2024-12-31&page=2&per_page=20

# Multi-sort: newest, then name ascending
GET /api/companies?sort.createdAt=desc&sort.name=asc

# Keyword search combined with sort/pagination
GET /api/companies?keyword=air&sort.createdAt=desc&page=1&per_page=10

# Combined filters and sorting
GET /api/companies?isActive=1&name.like=tech&sort.createdAt=desc&page=1&per_page=25
```

cURL examples:
```bash
curl "http://localhost:3000/api/companies?isActive=1&sort.createdAt=desc"
curl "http://localhost:3000/api/companies?createdAt.between=2024-01-01%2C2024-01-31"
curl "http://localhost:3000/api/companies?keyword=air&sort.name=asc&page=1&per_page=10"
```

Notes:
- Filters and sorting apply to root entity fields. Use `filtersWhitelist`/`sortingWhitelist` to control allowed fields.
- Keyword search supports nested dot-path `searchableFields` and merges required relations automatically.

#### Response filters payload
Each response includes a `filters` array echoing the parsed filters. Items now also include the original query token in `param` for traceability:
```json
{
  "filters": [
    { "field": "id", "op": "gte", "value": 21, "param": "id.min" },
    { "field": "id", "op": "lte", "value": 21, "param": "id.max" }
  ]
}
```
Use `param` to display or rebuild the user’s query in UIs/logs.

#### Pagination examples
- Defaults: `page=1`, `per_page=30` (if not provided)
- Example: page 3, 50 per page
```text
GET /api/companies?page=3&per_page=50
```
- Example: combine with filters and multi-sort
```text
GET /api/companies?isActive=1&sort.createdAt=desc&sort.name=asc&page=2&per_page=25
```
- Expected response pagination meta:
```json
{
  "pagination": {
    "page": 2,
    "perPage": 25,
    "totalItemsCount": 137,
    "totalPagesCount": 6,
    "isHavingNextPage": true,
    "isHavingPreviousPage": true
  }
}
```

## Adapters with other stacks

### Sequelize (preview)
You can create a Sequelize adapter that implements the same `OrmAdapter` interface. Keep your section config the same (model, relations/getRelations, hooks). Only `additionalSettings` will carry the sequelize-specific handles.

Example list implementation outline:
```ts
const SequelizeAdapter: OrmAdapter = {
  async list(req, cfg) {
    const { Model } = cfg.additionalSettings // your sequelize model
    // Build where/order/limit from req using same whitelists
    // return { items, pagination, filters, sorting }
  },
  // details/create/update/delete...
}
```

### Joi validator
Implement `ValidatorAdapter` with Joi:
```ts
export class JoiValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) { /* build Joi schema */ return schema }
  validate(input: any, schema: any) {
    const { error } = schema.validate(input, { abortEarly: false })
    return error ? { valid: false, errors: error.details } : { valid: true, errors: [] }
  }
}
```
Register in module: `forRoot({ defaultValidator: new JoiValidatorAdapter() })`.

### Zod validator
Implement `ValidatorAdapter` with Zod:
```ts
export class ZodValidatorAdapter implements ValidatorAdapter {
  generateSchemaFromModel(model: any, isUpdate: boolean) { return schema }
  validate(input: any, schema: any) {
    const res = schema.safeParse(input)
    return res.success ? { valid: true, errors: [] } : { valid: false, errors: res.error.issues }
  }
}
```

`getFinalValidationRules` works with any adapter: receive generated rules/schema, return the final one.

## Programmatic cross-section calls (callAction)
Sometimes you need to call another section’s action during a hook (e.g., create a related entity first). Use `CrudmanService.callAction(section, action, req, res, isResponseToBeSent)`.

Signature:
```ts
callAction(
  section: string,
  action: 'list'|'details'|'create'|'update'|'save'|'delete',
  req: any,
  res: any,
  isResponseToBeSent = false
): Promise<{ statusCode: number; data: any; headers?: Record<string, any> }>
```

- When `isResponseToBeSent` is false (default), the method captures the response and returns it without sending to the client.
- When true, it forwards status/headers/body to the original response.

Example (in onAfterValidate of section A, create in section B first):
```ts
onAfterValidate: async (req, res, _errors, _validator, service) => {
  if (req.body.createRelated === true) {
    const result = await service.callAction('related-section', 'save', req, res, false)
    if (result.data?.success === false) {
      res.status(result.statusCode).send(result.data)
      return false
    }
    // Use created id from related section
    const created = Array.isArray(result.data?.items) ? result.data.items[0] : result.data?.data
    if (created?.id) req.body.related_id = created.id
  }
  return true
}
```

## Save (upsert) action
Save lets you use a single endpoint/handler to create or update a record.

Behavior:
- If `recordSelectionField` (default `id`) is present in `req.params` or `req.body` → update.
- Otherwise → create.
- Follows the same validation flow as create/update:
  - generate rules → getFinalValidationRules → onBeforeValidate → validate → onAfterValidate.
- Respects `fieldsForUniquenessValidation` and `conditionTypeForUniquenessValidation`.
- Response: same envelope as create/update; `data` contains the saved entity.

Examples
- Service style:
```ts
await crud.save('companies', req, res)
```

- Programmatic (inside a hook or another service):
```ts
const { data, statusCode } = await crud.callAction('companies', 'save', req, res, false)
if (!data?.success) return res.status(statusCode).send(data)
```

- Decorator-driven:
```ts
import { Controller, Post } from '@nestjs/common'
import { UseCrud, CrudSave } from 'crudman-nestjs'
import { Company } from '../entities/company.entity'

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
export class CompaniesController {
  // POST /api/companies (create) or POST with id in body (update)
  @Post()
  @CrudSave('companies')
  saveCompany() {}
}
```

### Parameter naming and camelCase
- Defaults (camelCase):
  - page, perPage, paginate (false/0/no disables when allowed)
  - sort.<field> (e.g., sort.createdAt=desc)
  - Operators: .min, .max, .gt, .lt, .between, .like
  - keyword
- Custom names (per list action):
```ts
list: {
  queryParamNames: {
    page: 'p', perPage: 'pp', paginate: 'pg',
    sortPrefix: 'order.',
    minOp: 'from', maxOp: 'to', betweenOp: 'range', likeOp: 'contains',
    keyword: 'q'
  }
}
```
- The adapter normalizes snake_case to camelCase (e.g., per_page → perPage) for compatibility.

### Pagination toggles and limits
- Per-action config:
```ts
list: {
  pagination: {
    isPaginationEnabled: true,    // set false to always return all
    isDisableAllowed: true,       // honor paginate=false / perPage=0
    isDefaultEnabled: true,       // if false and no page/perPage provided, return all
    maxPerPage: 100               // cap perPage
  }
}
```
- Query examples (with defaults):
  - Disable: `?paginate=false` or `?perPage=0`
  - Custom names: `?pg=false` (with paginate renamed to 'pg')
- When disabled, the response includes all matching items and a minimal pagination snapshot without COUNT overhead.
