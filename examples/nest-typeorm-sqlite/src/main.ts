import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DataSource } from 'typeorm'
import { setCrudmanDataSource, enhanceCrudSwaggerDocument } from 'crudman-nestjs'
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Provide DataSource to the registry so the adapter can auto-resolve repositories
  const ds = app.get(DataSource)
  setCrudmanDataSource(ds)

  const config = new DocumentBuilder().setTitle("Example").setVersion("1.0").build()
  const document = SwaggerModule.createDocument(app, config)
  enhanceCrudSwaggerDocument(document)
  SwaggerModule.setup("docs", app, document)
  await app.listen(3001)
  console.log('Example app running at http://localhost:3001')
}
bootstrap()
