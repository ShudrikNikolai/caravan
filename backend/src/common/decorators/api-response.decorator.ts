import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export interface IApiResponseOptions {
  status?: number;
  example?: unknown;
  description?: string;
  isArray?: boolean;
}

export function ApiStandardResponse(
  model: Type<unknown>,
  options: IApiResponseOptions = {},
) {
  const status = options.status ?? 200;
  const description = options.description ?? `Response ${status}`;

  return applyDecorators(
    ApiExtraModels(model),

    ApiResponse({
      status,
      description: description,
      ...(options.example !== undefined && { example: options.example }),
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            example: status,
          },
          data: options.isArray
            ? {
                type: 'array',
                items: {
                  $ref: getSchemaPath(model),
                },
              }
            : {
                $ref: getSchemaPath(model),
              },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    }),
  );
}
