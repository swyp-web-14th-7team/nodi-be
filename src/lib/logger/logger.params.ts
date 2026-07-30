import type { Params } from 'nestjs-pino';
import { ulid } from 'ulid';
import type { Request, Response } from 'express';
import type {
  SerializedRequest,
  SerializedResponse,
} from 'pino-std-serializers';

const isProd = process.env.NODE_ENV === 'prod';

/**
 * `nestjs-pino` 설정. 모듈이 아니라 설정 객체만 내보낸다.
 *
 * `@InjectPinoLogger(X)` 는 데코레이터가 실행될 때(= 그 클래스 파일이 require 될 때)
 * X 를 라이브러리 내부 Set 에 등록하고, `LoggerModule.forRoot()` 는 호출 시점의 Set 을
 * 한 번만 스냅샷해 `PinoLogger:X` 프로바이더를 만든다. 그래서 forRoot() 를 별도 래퍼
 * 모듈의 `@Module` 데코레이터 안에서 호출하면, 그 래퍼보다 늦게 로드되는 서비스의
 * 토큰은 아예 생성되지 않는다(= "Nest can't resolve PinoLogger:XxxService").
 *
 * 따라서 forRoot() 는 AppModule 의 imports 배열에서 호출한다. `@Module({...})` 인자는
 * app.module.ts 의 모든 import 문이 평가된 뒤에 만들어지므로, 그 시점에는 모듈 그래프의
 * 모든 데코레이터가 실행 완료된 상태다. import 순서에 영향받지 않는다.
 *
 * nestjs-pino 의 LoggerModule 은 `@Global()` 이라 개별 기능 모듈에서 다시 import 할
 * 필요가 없다.
 */
export const pinoLoggerParams: Params = {
  assignResponse: true,
  pinoHttp: {
    level: isProd ? 'info' : 'debug',
    transport: isProd ? undefined : { target: 'pino-pretty' },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    autoLogging: {
      ignore: (req) => (req.url ?? '').split('?')[0] === '/health',
    },
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
      formatters: {
        level: (label: string) => ({ level: label }),
      },
    }),
  },
};
