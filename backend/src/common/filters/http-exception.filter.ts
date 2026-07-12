import { IApiResponse } from '@/common/interfaces/api-response.interface';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.setContext(HttpExceptionFilter.name);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const exeRes = exceptionResponse as {
          message?: string;
          errors?: unknown[];
        };
        message = exeRes?.message || message;
        errors = exeRes?.errors || [];
      }
    } else if (exception instanceof Error) {
      // TODO сделать флаг только для дева -> message = `${exception.name}: ${exception.message}`;
      message = 'Internal Server Error';
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    this.logger.error(
      {
        status,
        message,
        params: request.params,
        query: request.query,
      },
      `[${request.method}] ${request.url}`,
    );

    const apiResponse: IApiResponse = {
      status,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(apiResponse);
  }
}
