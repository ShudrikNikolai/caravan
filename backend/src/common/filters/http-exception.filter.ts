import { IApiResponse } from '@/common/interfaces/api-response.interface';
import { ConfigService } from '@/config';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { API_RESPONSE_ERROR } from '../utils/const.util';
import { redactQueryParams } from '../utils/redact.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    private readonly cfg: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    this.logger.setContext(HttpExceptionFilter.name);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = API_RESPONSE_ERROR.INTERNAL_SERVER_ERROR;
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
        if (Array.isArray(exeRes.message)) {
          message = API_RESPONSE_ERROR.VALIDATION_FAILED;
          errors = exeRes.message;
        } else {
          message = exeRes?.message || message;
          errors = exeRes?.errors || [];
        }
      }
    } else if (exception instanceof Error) {
      message = API_RESPONSE_ERROR.INTERNAL_SERVER_ERROR;
      if (this.cfg.isDev) {
        message = `${exception.name}: ${exception.message}`; // Только для дебага на деве
      }
      this.logger.error(
        { err: exception },
        API_RESPONSE_ERROR.UNHANDLED_EXCEPTION,
      );
    }

    this.logger.error(
      {
        status,
        message,
        params: request.params,
        query: redactQueryParams(request.query),
      },
      `[${request.method}] ${request.url}`,
    );

    const apiResponse: IApiResponse = {
      status,
      errors: {
        details: errors,
        message,
      },
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(apiResponse);
  }
}
