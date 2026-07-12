import { Global, Module } from '@nestjs/common';
import { LoggerModule as LoggerPinoModule } from 'nestjs-pino';
import { ConfigService } from '@/config';
import { LoggerService } from './logger.service';
import { IncomingMessage } from 'http';

@Global()
@Module({
  imports: [
    LoggerPinoModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          transport: config.isDev
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
          customProps: (req: IncomingMessage) => {
            const headers = req.headers;
            const traceId =
              'x-trace-id' in headers
                ? headers['x-trace-id']
                : crypto.randomUUID();
            return {
              context: 'HTTP',
              traceId,
            };
          },
          serializers: {
            req: (req: IncomingMessage) => ({
              method: req.method,
              url: req.url,
              headers: req.headers,
            }),
          },
          level: config.logger.level,
        },
      }),
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
