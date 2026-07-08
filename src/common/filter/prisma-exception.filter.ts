import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { Prisma } from '@/prisma/client';

/**
 * Prisma 의 KnownRequestError(P2xxx) 를 사용자 친화적인 HTTP 응답으로 변환하는 전역 필터.
 * 각 서비스에서 개별적으로 잡지 않은 Prisma 에러의 안전망 역할을 한다.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.mapError(exception);

    if (status >= 500) {
      this.logger.error(
        `Prisma ${exception.code} at ${request.method} ${request.url}: ${exception.message}`,
      );
    } else {
      this.logger.warn(
        `Prisma ${exception.code} at ${request.method} ${request.url}: ${message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status],
      path: request.url,
    });
  }

  private mapError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (e.code) {
      // Unique constraint 위반
      case 'P2002': {
        const field = this.extractTarget(e);
        return {
          status: HttpStatus.CONFLICT,
          message: field
            ? `이미 존재하는 값입니다: ${field}`
            : '이미 존재하는 값입니다.',
        };
      }
      // Foreign key constraint 위반 (존재하지 않는 참조)
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '존재하지 않는 참조 값이 포함되어 있습니다.',
        };
      // 조회/수정/삭제 대상 레코드 없음
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: '요청한 데이터를 찾을 수 없습니다.',
        };
      // 그 외 known error 는 서버 오류로 처리 (실제 원인은 로깅)
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 요청 처리 중 오류가 발생했습니다.',
        };
    }
  }

  /** P2002 의 meta.target(위반한 컬럼) 을 사람이 읽을 수 있는 문자열로 변환 */
  private extractTarget(
    e: Prisma.PrismaClientKnownRequestError,
  ): string | undefined {
    const target = e.meta?.target;
    if (Array.isArray(target)) return target.join(', ');
    if (typeof target === 'string') return target;
    return undefined;
  }
}
