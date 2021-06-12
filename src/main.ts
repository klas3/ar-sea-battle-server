import { NestFactory } from '@nestjs/core';
import environment from './other/environment';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(environment.port);
}

bootstrap();
