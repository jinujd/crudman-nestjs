---
layout: default
title: CRUDMan NestJS
---

<p align="center">
  <img src="assets/crudman-logo.svg" alt="CRUD Man Logo" width="140" />
</p>

<h1 style="color:#352D77">crudman-nestjs</h1>

Pluggable CRUD for NestJS with adapters, validation, caching, and auto routes.

- TypeORM-first; Sequelize-ready via future adapter
- fastest-validator by default; adapter interface supports Joi later
- relations/getRelations, filters/sorting whitelists
- Standard, configurable response envelope
- NodeCache per-endpoint caching; global invalidation on writes
- Decorators and auto routes via CrudControllerBase

<h2 style="color:#3F4C70">Quick links</h2>
- [GitHub](https://github.com/jinujd/crudman-nestjs)
- [README on GitHub](https://github.com/jinujd/crudman-nestjs#readme)

<h2 style="color:#3F4C70">Install</h2>
```bash
npm i crudman-nestjs
```

<h2 style="color:#3F4C70">Usage</h2>
```ts
@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}
```

<h2 style="color:#3F4C70">Config</h2>
See README for complete configuration, caching, validation hooks, and swagger.
