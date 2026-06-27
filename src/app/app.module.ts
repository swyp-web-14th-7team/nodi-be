import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/lib/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/feature/auth/auth.module';
import { UsersModule } from '@/feature/users/users.module';
import { LoggerModule } from 'nestjs-pino';
import { ulid } from 'ulid';
import type { Request, Response } from 'express';
import type {
  SerializedRequest,
  SerializedResponse,
} from 'pino-std-serializers';
import 'dotenv/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      assignResponse: true,
      pinoHttp: {
        level: process.env.NODE_ENV !== 'prod' ? 'debug' : 'info',
        transport:
          process.env.NODE_ENV !== 'prod'
            ? { target: 'pino-pretty' }
            : undefined,
        genReqId: (req: Request, res: Response) => {
          const existing = req.headers['x-request-id'];
          if (existing) return existing;
          const id = ulid();
          res.setHeader('x-request-id', id);
          return id;
        },
        serializers: {
          req(req: SerializedRequest) {
            return {
              id: req.id,
              method: req.method,
              url: req.url,
              ...(process.env.NODE_ENV !== 'prod' && {
                headers: {
                  authorization: req.headers.authorization,
                },
              }),
            };
          },
          res(res: SerializedResponse) {
            return { statusCode: res.statusCode, headers: res.headers };
          },
        },
        ...(process.env.NODE_ENV === 'prod' && {
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        }),
      },
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
