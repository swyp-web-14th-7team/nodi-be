import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { TransformInterceptor } from '@/common/interceptor/transform.interceptor';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.use(cookieParser());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // 요청을 DTO 인스턴스로 변환 → 기본값 주입 + 타입 변환(@Type) 적용
    }),
  );
  app.enableCors({
    origin: true, // 요청 origin 반영 (dev용). 운영에선 허용 도메인 명시 권장
    credentials: true, // 쿠키(device_id) 주고받기 허용
  });
  app.useLogger(app.get(Logger));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Fail to start application', err);
  process.exit(1);
});
