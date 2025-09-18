# crudman-nestjs

A lightweight NestJS library providing a simple `CrudmanModule` and `CrudmanService` to kickstart CRUD utilities in your Nest apps.

## Installation

```bash
npm i crudman-nestjs
```

## Usage

```ts
import { Module } from '@nestjs/common';
import { CrudmanModule, CrudmanService } from 'crudman-nestjs';

@Module({
  imports: [CrudmanModule],
})
export class AppModule {}

// Later in a provider:
constructor(private readonly crudman: CrudmanService) {}

this.crudman.getHello();
```

## Development

- Build: `npm run build`
- Clean: `npm run clean`

## License

MIT
