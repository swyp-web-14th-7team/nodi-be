import { OpenAPIObject } from '@nestjs/swagger';

/**
 * Swagger가 POST 등에 자동 생성하는 201(Created) 응답을 200으로 통일한다.
 * 런타임 상태코드는 TransformInterceptor가 200으로 처리하므로, 문서도 이에 맞춘다.
 */
export function normalizeSuccessStatus(document: OpenAPIObject): void {
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (
        !operation ||
        typeof operation !== 'object' ||
        Array.isArray(operation)
      ) {
        continue;
      }

      const responses = (operation as { responses?: Record<string, unknown> })
        .responses;
      if (responses && '201' in responses) {
        responses['200'] ??= responses['201'];
        delete responses['201'];
      }
    }
  }
}
