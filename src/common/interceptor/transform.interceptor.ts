import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ResponseSuccess } from '@/common/type/response-success.type';
import { type Response } from 'express';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseSuccess<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseSuccess<T>> {
    const res = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data: T): ResponseSuccess<T> => {
        // 모든 성공 응답 상태코드를 200으로 통일
        res.statusCode = HttpStatus.OK;
        return new ResponseSuccess(data, HttpStatus.OK);
      }),
    );
  }
}
