import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { join } from 'path'
import { existsSync } from 'fs'
import { NestExpressApplication } from '@nestjs/platform-express'
import { enhanceCrudSwaggerDocument } from 'crudman-nestjs'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Serve uploads folder for local development
  const up = join(process.cwd(), 'uploads')
  if (existsSync(up)) app.useStaticAssets(up, { prefix: '/uploads/' })

  const config = new DocumentBuilder().setTitle("Example").setVersion("1.0").build()
  const document = SwaggerModule.createDocument(app, config)

  try {
    enhanceCrudSwaggerDocument(document)
  } catch (e) {
    // Ensure docs still mount even if enhancement throws in dev
    console.error('enhanceCrudSwaggerDocument failed:', e)
  }
  SwaggerModule.setup('docs', app, document)
  console.log('Swagger docs available at http://localhost:3001/docs')

  await app.init()
  await app.listen(3001)
  console.log('Example app running at http://localhost:3001')
}
bootstrap()
