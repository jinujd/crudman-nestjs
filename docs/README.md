# crudman-nestjs

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
- PUT /api/users/:id
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

Keys:
- model: your entity.
- relations/getRelations: relation names or function returning them.
- filtersWhitelist/sortingWhitelist: only allow these fields in request-driven filters/sorting.
- orderBy: default ordering.
- recordSelectionField: defaults to `id`.
- hooks: `onBeforeAction`, `onAfterAction`, `onBeforeQuery`, `afterFetch`, `onBeforeValidate`, `onAfterValidate`.
- enableCache: boolean | { ttl, key }. Per-action cache; global cache in forRoot.
- additionalSettings.repo: your TypeORM repository instance (required).

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
- Use: Run before doing the action (list/details/create/update/save/delete). Return `false` to abort.
- Returns: `false` to stop; anything else continues.
- Example:
```ts
onBeforeAction: async (req) => {
  if (!req.identity?.id) return false // block anonymous
}
```

### onAfterAction(result, req, service)
- Type: `(result: any, req: RequestLike, service: CrudmanService) => any | void | Promise<any | void>`
- Use: Mutate or replace the formatted response just before sending.
- Returns: Return a new result to replace, or nothing to keep the original.
- Example:
```ts
onAfterAction: async (result) => ({ ...result, servedAt: new Date().toISOString() })
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
- Example:
```ts
getFinalValidationRules: async (rules) => ({
  ...rules,
  password: { type: 'string', min: 8 }
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

## Caching
- NodeCache is used by default. Configure at module level and per action (`enableCache`).
- Writes invalidate cached lists by default (configurable with `invalidateListsOnWrite`).

## Swagger / OpenAPI
- Enabled globally via `forRoot({ swagger: { enabled: true } })` or disable per endpoint in decorator options.
- Provide a DTO per endpoint to type `data` for the docs.

## Swapping adapters
- ORM: default TypeORM adapter; a Sequelize adapter can be added later with same config keys.
- Validator: default fastest-validator; later swap in Joi via `ValidatorAdapter`.

## Testing
- Vitest tests included for utils, formatter, validator, and ORM adapter.

## License
MIT

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
