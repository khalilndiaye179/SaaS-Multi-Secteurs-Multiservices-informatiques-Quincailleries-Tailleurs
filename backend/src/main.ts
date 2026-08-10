import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🚀 Backend SaaS Multi-Secteurs démarré sur http://localhost:${port}`);
}
bootstrap();
