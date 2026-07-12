import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@/config';
import { LoggerService } from '@/infra/logger/logger.service';

const setupSwagger = (
  app: INestApplication,
  config: ConfigService,
  logger: LoggerService,
): void => {
  const { name, port, version } = config.app;
  const { enable, path } = config.swagger;

  if (!enable) {
    return;
  }

  const documentBuilder = new DocumentBuilder()
    .setTitle(name)
    .setDescription(`${name} API document`)
    .setVersion(version);

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    ignoreGlobalPrefix: false,
    extraModels: [],
  });

  SwaggerModule.setup(path, app, document, {});

  logger.log(`Swagger running on http://127.0.0.1:${port}/${path}`);
};

export default setupSwagger;
