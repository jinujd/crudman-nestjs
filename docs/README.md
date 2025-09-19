# crudman-nestjs

We believe everyone building RESTful services with NestJS—especially CRUD‑heavy backends—will find this library helpful. It gives you out‑of‑the‑box CRUD endpoints, a clear configuration model, and the freedom to override anything when you need custom behavior. The design centers on adapters (ORM and validator), safe query handling, and simple developer ergonomics so you can start fast and customize when needed.

## Features

- 🔌 Super easy to install and start using auto‑generated CRUD endpoints
- 🐙 Adapter‑based and DB/service‑agnostic (TypeORM by default; Sequelize‑ready)
- 🔎 Rich query handling: filtering, pagination, sorting, relations via safe whitelists
- 🧪 Validation included by default (fastest‑validator) and pluggable (Joi/Zod via adapters)
- 🎬 Override controller methods with ease using decorators or custom handlers
- 🔧 Tiny config: global module options + per‑section settings
- 🎁 Helper decorators and a base controller for zero‑boilerplate endpoints
- ✏️ Swagger/OpenAPI friendly (DTOs per action for typed `data`)
- 🧊 Caching with NodeCache; per‑endpoint TTL and automatic invalidation on writes

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

Keys (per action, unless noted):
- model (required): Entity class.
- relations (optional): string[].
- getRelations(req,res,cfg) (optional): Promise<string[]> | string[].
- filtersWhitelist (optional): string[]. If not provided, all entity columns are allowed (derived from repository metadata).
- sortingWhitelist (optional): string[]. If not provided, all entity columns are allowed (derived from repository metadata).
- orderBy (optional): Array<[field, "ASC"|"DESC"]>.
- recordSelectionField (optional): string, default "id".
- fieldsForUniquenessValidation (optional): string[].
- conditionTypeForUniquenessValidation (optional): "or"|"and".
- hooks (optional): onBeforeAction, onAfterAction, onBeforeQuery, afterFetch, onBeforeValidate, onAfterValidate.
- getFinalValidationRules(generatedRules, req, res, validator) (optional): returns new rules.
- enableCache (optional): boolean | { ttl?: number; key?:(ctx)=>string }.
- additionalSettings.repo (required for TypeORM adapter): repository instance.

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

Default whitelist behavior:
- When `filtersWhitelist` or `sortingWhitelist` are omitted, the library resolves allowed fields from the TypeORM repository’s columns (`repo.metadata.columns`). This enables filter/sort on all fields by default while staying strictly model-scoped. To restrict inputs on public endpoints, set explicit whitelists.

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
- Provide a DTO per endpoint to type `data` for the docs.

### Import / Export

- Export via x-content-type:
  - Set header `x-content-type: csv` on list or details GET to receive CSV.
  - For list, only the `data` array is included in CSV. Pagination/meta are provided in headers:
    - `X-Pagination-Total`, `X-Pagination-Page`, `X-Pagination-PerPage`, `X-Filters`, `X-Sorting`.
  - Default when header not provided: JSON.

Example (cURL):
```bash
curl -H "x-content-type: csv" -i "http://localhost:3001/api/states"
# Inspect headers for pagination/meta; body contains CSV rows only
```

Swagger header parameter:
- `x-content-type` enum reflects allowed types. To restrict globally:
```ts
CrudmanModule.forRoot({ exportContentTypes: ['json','csv'] })
```

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

  @Put('companies/:id')
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

### Query parameters: filters, sorting, pagination (Companies)

Supported filters (root fields):
- Equals: `field=value`
- Like (substring): `field.like=value`
- Numeric/Date ranges: `field.min=value`, `field.max=value`, `field.gt=value`, `field.lt=value`
- Between (date/number): `field.between=start,end` (encode comma if needed: `%2C`)

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

## Example: Blog with slug as recordSelectionField

```ts
import { Controller, Get } from '@nestjs/common'
import { UseCrud, CrudList, CrudDetails } from 'crudman-nestjs'
import { BlogPost } from './blog-post.entity'

@UseCrud({ sections: { posts: { model: BlogPost, recordSelectionField: 'slug' } } })
@Controller('api/posts')
export class PostsController {
  @Get() @CrudList('posts') list() {}
  @Get(':slug') @CrudDetails('posts') details() {}
}
```

- Details path param will be `:slug` and Swagger will require `slug`.
- Delete/Update will also use `:slug`.
- List supports normal filters and keyword search; you can add `filtersWhitelist: ['slug','title']`.
