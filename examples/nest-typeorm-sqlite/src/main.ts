import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource } from 'crudman-nestjs'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Provide DataSource to the registry so the adapter can auto-resolve repositories
  const ds = app.get(DataSource)
  setCrudmanDataSource(ds)
  await app.listen(3001)
  console.log('Example app running at http://localhost:3001')
}
bootstrap()
