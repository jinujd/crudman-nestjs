---
layout: default
title: CRUDMan NestJS
---

# crudman-nestjs

Pluggable CRUD for NestJS with adapters, validation, caching, and auto routes.

- TypeORM-first; Sequelize-ready via future adapter
- fastest-validator by default; adapter interface supports Joi later
- relations/getRelations, filters/sorting whitelists
- Standard, configurable response envelope
- NodeCache per-endpoint caching; global invalidation on writes
- Decorators and auto routes via CrudControllerBase

## Quick links
- [GitHub](https://github.com/jinujd/crudman-nestjs)
- [README](../README.md)

## Install
```bash
npm i crudman-nestjs
```

## Usage
```ts
@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

## Config
See README for complete configuration, caching, validation hooks, and swagger.
