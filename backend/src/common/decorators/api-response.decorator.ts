import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

export interface IApiResponseOptions {
  status?: number;
  message?: string;
  example?: any;
  isArray?: boolean;
  isPaginated?: boolean;
}

export const API_RESPONSE_METADATA = 'api_response_metadata' as const;

export function ApiResponse(options: IApiResponseOptions) {
  return applyDecorators(
    SetMetadata(API_RESPONSE_METADATA, options),
    SwaggerApiResponse({
      status: options.status || 200,
      description: options.message || 'Success',
      schema: {
        properties: {
          status: { type: 'number', example: options.status || 200 },
          message: { type: 'string', example: options.message || 'Success' },
          data: options.isArray
            ? { type: 'array', items: { type: 'object' } }
            : { type: 'object' },
          timestamp: { type: 'string', example: '2025-12-12T10:30:00.000Z' },
        },
      },
    }),
  );
}

export function ApiCreatedResponse(message?: string, example?: unknown) {
  return ApiResponse({ status: 201, message: message || 'Created', example });
}

export function ApiOkResponse(message?: string, example?: unknown) {
  return ApiResponse({ status: 200, message: message || 'OK', example });
}

export function ApiPaginatedResponse(message?: string, example?: unknown) {
  return ApiResponse({
    status: 200,
    message: message || 'Success',
    example,
    isPaginated: true,
  });
}
