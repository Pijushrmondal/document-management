import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable CORS for all origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // HTTP request logger
  app.use(morgan('dev'));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('NestJS API with MongoDB')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📘 Swagger docs: http://localhost:${port}/api-docs`);
}

bootstrap();
