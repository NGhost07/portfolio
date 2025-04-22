import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { ResponseInterceptor } from './common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get<ConfigService>(ConfigService)

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  })
  app.useGlobalFilters()
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) =>
          error.constraints ? Object.values(error.constraints) : [],
        )

        return new BadRequestException(messages)
      },
    }),
  )

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('Portfolio API development')
    .addServer(
      `http://localhost:${config.get('PORT')}`,
      `Development API[PORT=${config.get('PORT')}]`,
    )
    // .addServer('https://be2.nambe.dev', 'Development API')
    .addBearerAuth({
      description: `Please enter token in following format: Bearer <JWT>`,
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      type: 'http',
      in: 'Header',
    })
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  })

  SwaggerModule.setup('docs', app, document, {
    customCssUrl: '.',
    swaggerOptions: {
      persistAuthorization: true,
      uiConfig: {
        docExpansion: 'none',
      },
      docExpansion: 'none',
    },
  })

  await app.listen(config.get<number>('PORT') ?? 3000)
  return app.getUrl()
}
bootstrap().then((url) => {
  console.log(`Server is running on: ${url}`)
})
