import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request, Response } from 'express';
import {
  IApiResponse,
  IPaginatedResponse,
  IQueryParams,
  IRawPaginatedResult,
} from '../interfaces/api-response.interface';
import { redactQueryParams } from '../utils/redact.util';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IApiResponse<T> | IPaginatedResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const queryParams = request.query as IQueryParams;

    return next.handle().pipe(
      map((data: T | IApiResponse<T> | IRawPaginatedResult<T>) => {
        const statusCode = response.statusCode || HttpStatus.OK;

        if (this.isApiResponse(data)) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            query: this.extractRelevantQueryParams(queryParams),
          };
        }

        if (this.isPaginated<T>(data)) {
          return this.formatPaginatedResponse(data, queryParams, statusCode);
        }

        return this.formatResponse(data, queryParams, statusCode);
      }),
    );
  }

  private formatResponse(
    data: T,
    queryParams: IQueryParams,
    status: number,
  ): IApiResponse<T> {
    return {
      status,
      data,
      timestamp: new Date().toISOString(),
      query: this.extractRelevantQueryParams(queryParams),
    };
  }

  private formatPaginatedResponse(
    data: IRawPaginatedResult<T>,
    queryParams: IQueryParams,
    status: number,
  ): IPaginatedResponse<T> {
    const { items, meta } = data;
    const { page, limit, total } = meta;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    return {
      status,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
      query: this.extractRelevantQueryParams(queryParams),
    };
  }

  private extractRelevantQueryParams(
    queryParams: IQueryParams,
  ): Record<string, unknown> | null {
    return redactQueryParams(queryParams);
  }

  private isApiResponse(data: unknown): data is IApiResponse<T> {
    return !!(
      data &&
      typeof data === 'object' &&
      'status' in data &&
      'data' in data &&
      !('items' in data)
    );
  }

  private isPaginated<K>(data: unknown): data is IRawPaginatedResult<K> {
    return !!(
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'meta' in data
    );
  }
}
