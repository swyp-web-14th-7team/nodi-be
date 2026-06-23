import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { TransformInterceptor } from '@/common/interceptor/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Fail to start application', err);
  process.exit(1);
});
