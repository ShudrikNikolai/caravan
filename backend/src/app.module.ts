import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { InfrastructureModule } from './infrastructure/infra.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [ConfigModule, InfrastructureModule, HealthModule],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
