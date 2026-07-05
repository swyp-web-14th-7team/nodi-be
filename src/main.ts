import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { TransformInterceptor } from '@/common/interceptor/transform.interceptor';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { normalizeSuccessStatus } from '@/common/swagger/normalize-success-status';

const port = process.env.PORT || 3000;

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

  const config = new DocumentBuilder()
    .setTitle('프로필 카드 공유 서비스 API')
    .setDescription('프로필 카드 공유 서비스 백엔드')
    .setVersion(`${process.env.npm_package_version}`)
    .addBearerAuth()
    .addServer(`http://localhost:${port}`, 'local')
    .addServer(`${process.env.PRODUCTION_URL}`, '배포 서버')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  normalizeSuccessStatus(document);
  SwaggerModule.setup('api-docs', app, document, { jsonDocumentUrl: 'docs' });

  app.enableShutdownHooks();
  await app.listen(port);
}
bootstrap().catch((err) => {
  console.error('Fail to start application', err);
  process.exit(1);
});
