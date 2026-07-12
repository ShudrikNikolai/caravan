import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import setupSwagger from './swagger';
import { VersioningType } from '@nestjs/common';
import { LoggerService } from '@/infra/logger/logger.service';
import { ConfigService } from './config';
// TODO добавить линтер на пакеты
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(LoggerService);
  app.useLogger(logger);

  const config = app.get(ConfigService);

  app.setGlobalPrefix(config.app.globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.app.version,
  });

  setupSwagger(app, config, logger);

  await app.listen(config.app.port);
  logger.log(`Server is starting: http://127.0.0.1:${config.app.port}`);
}
bootstrap();
