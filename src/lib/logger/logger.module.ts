import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ulid } from 'ulid';
import type { Request, Response } from 'express';
import type {
  SerializedRequest,
  SerializedResponse,
} from 'pino-std-serializers';

const isProd = process.env.NODE_ENV === 'prod';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      assignResponse: true,
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        transport: isProd ? undefined : { target: 'pino-pretty' },
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
              ...(!isProd && {
                headers: {
                  authorization: req.headers.authorization,
                },
                cookie: req.headers.cookie,
              }),
            };
          },
          res(res: SerializedResponse) {
            return { statusCode: res.statusCode, headers: res.headers };
          },
        },
        ...(isProd && {
          redact: ['req.headers.authorization', 'req.headers.cookie'],
          // pino 기본 출력은 level 이 숫자(30=info, 50=error). Loki 에서 level="error" 로
          // 필터하고 Grafana 가 레벨을 인식하도록 문자열로 출력.
          // dev 는 pino-pretty 가 숫자 레벨을 알아서 색칠해 주므로 그대로 둠.
          formatters: {
            level: (label: string) => ({ level: label }),
          },
        }),
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
