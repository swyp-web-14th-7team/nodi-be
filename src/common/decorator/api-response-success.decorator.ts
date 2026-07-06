import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseSuccess } from '@/common/type/response-success.type';

export const ApiResponseSuccess = <TModel extends Type>(
  model?: TModel,
  options?: { status?: number; isArray?: boolean },
) => {
  const modelSchema = model
    ? { $ref: getSchemaPath(model) }
    : { type: 'object' as const, additionalProperties: false, examples: {} };
  // isArray 면 data 를 배열 스키마로 감쌈
  const dataSchema = options?.isArray
    ? { type: 'array' as const, items: modelSchema }
    : modelSchema;

  return applyDecorators(
    ApiExtraModels(...(model ? [ResponseSuccess, model] : [ResponseSuccess])),
    ApiResponse({
      status: options?.status ?? 200,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseSuccess) },
          { properties: { data: dataSchema }, required: ['data'] },
        ],
      },
    }),
  );
};
