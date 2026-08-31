import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import setupSwagger from './swagger';
import { VersioningType } from '@nestjs/common';
import { LoggerService } from '@/infra/logger/logger.service';
import { ConfigService } from './config';
import cookieParser from 'cookie-parser';
// TODO добавить линтер на пакеты
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);
  app.use(cookieParser());
  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.app.globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.app.version,
  });

  app.enableCors({
    origin: '*', //process.env.APP_BASE_URL, // TODO
    credentials: true,
  });

  setupSwagger(app, config, logger);

  await app.listen(config.app.port);
  logger.log(`Server is starting: http://127.0.0.1:${config.app.port}`);
}
bootstrap();
