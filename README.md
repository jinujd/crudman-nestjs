# crudman-nestjs

A pluggable CRUD library for NestJS with:
- TypeORM-first ORM adapter (Sequelize-ready via future adapter)
- fastest-validator validation (validator adapter interface supports Joi/Zod later)
- relations/getRelations, filters/sorting whitelists
- standard, configurable response formatter
- NodeCache caching with per-endpoint control
- Decorators and auto routes via CrudControllerBase
- OpenAPI/Swagger friendly with DTO typing per action

## Installation

```bash
npm i crudman-nestjs
```

## Quick start

1) Register module (defaults and cache):
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
    }),
  ],
})
export class AppModule {}
```

2) Minimal controller with auto routes:
```ts
import { Controller } from '@nestjs/common';
import { UseCrud, CrudControllerBase } from 'crudman-nestjs';
import { User } from '../entities/user.entity';

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

Routes: GET /, GET /:id, POST /, PUT /:id, DELETE /:id

## Config options

Section config (minimal):
```ts
{ model: User }
```
Expanded:
```ts
{
  model: User,
  list: {
    relations: ['profile'],
    getRelations: async (req) => (req.query.withRoles ? ['profile','roles'] : ['profile']),
    filtersWhitelist: ['email','createdAt','role'],
    sortingWhitelist: ['createdAt','email'],
    orderBy: [['createdAt','DESC']],
    onBeforeQuery: async (qb) => qb,
    onBeforeValidate: async (req, res, rules, validator) => true,
    onAfterValidate: async (req, res, errors, validator) => true,
    enableCache: { ttl: 60 },
  },
  details: { relations: ['profile'], enableCache: true },
  create: { fieldsForUniquenessValidation: ['email'] },
  update: { fieldsForUniquenessValidation: ['email'] },
  delete: {},
  requiredRoles: ['admin'],
  ownership: { field: 'user_id' },
}
```

- relations/getRelations: join related entities.
- filtersWhitelist/sortingWhitelist: only allow explicit fields from query.
- orderBy: default ordering.
- onBeforeAction/onAfterAction/onBeforeQuery/afterFetch: lifecycle hooks.
- onBeforeValidate/onAfterValidate: validation hooks (fastest-validator by default).
- enableCache: boolean | { ttl, key }. Per-action cache, global cache via module config.

## Response format (default)

List:
```json
{
  "data": [],
  "errors": [],
  "success": true,
  "pagination": {
    "page": 1,
    "perPage": 20,
    "totalPagesCount": 0,
    "totalItemsCount": 0,
    "isHavingNextPage": false,
    "isHavingPreviousPage": false
  },
  "filters": [],
  "sorting": []
}
```
Details:
```json
{ "data": {}, "errors": [], "success": true }
```
You can override globally with `defaultResponseFormatter` or per action via `responseHandler`.

## Decorator-driven custom handlers
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

## Swapping adapters
- ORM: default TypeORM adapter; add a Sequelize adapter later with same config keys.
- Validator: default fastest-validator; later swap in Joi via ValidatorAdapter.

## Caching
- NodeCache is used by default. Configure at module level and per action (`enableCache`).
- Writes invalidate cached lists by default (configurable).

## Security
- Provide `identityAccessor` and `roleChecker` in `forRoot`, and per section `requiredRoles` & `ownership` for simple authorization.

## Testing
- Vitest tests included for utils, formatter, validator, and ORM adapter.

## License
MIT
