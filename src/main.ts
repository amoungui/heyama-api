/* eslint-disable @typescript-eslint/no-floating-promises */
// api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:8082',
      'http://192.168.1.103:3001',
      'http://192.168.1.103:8082',
      'http://localhost:19006',
      'http://192.168.1.103:8082',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  await app.listen(3000);
  console.log('API running on http://localhost:3000');
}
bootstrap();
