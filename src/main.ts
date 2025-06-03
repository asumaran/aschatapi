import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4001'],
  });

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap().catch((error) => {
  console.error('Error starting the application', error);
});
