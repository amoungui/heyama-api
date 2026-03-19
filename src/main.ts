import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Railway injecte automatiquement la variable PORT
  const port = process.env.PORT || 3000;
  
  // '0.0.0.0' est indispensable pour le déploiement Cloud
  await app.listen(port, '0.0.0.0');
  
  console.log(`API running on port ${port}`);
}
bootstrap();