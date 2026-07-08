import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseSuccess } from '@/common/type/response-success.type';
import {
  PaginationMetadata,
  PaginationType,
} from '@/common/type/pagination.type';

export const ApiResponsePagination = <TModel extends Type>(
  model: TModel,
  options?: { status?: number },
) => {
  return applyDecorators(
    ApiExtraModels(ResponseSuccess, PaginationType, PaginationMetadata, model),
    ApiResponse({
      status: options?.status ?? 200,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseSuccess) },
          {
            properties: {
              // data = PaginationType 이되, items 는 model 배열로 치환
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginationType) },
                  {
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                      metadata: { $ref: getSchemaPath(PaginationMetadata) },
                    },
                  },
                ],
              },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
};
