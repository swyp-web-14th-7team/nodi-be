import {
  CallHandler,
  ExecutionContext,
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
    const status = context.switchToHttp().getResponse<Response>().statusCode;
    return next
      .handle()
      .pipe(
        map((data: T): ResponseSuccess<T> => new ResponseSuccess(data, status)),
      );
  }
}
