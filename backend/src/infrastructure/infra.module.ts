import { Module } from '@nestjs/common';
import { LoggerModule } from './logger/logger.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './database/database.module';
import { MetricsModule } from './metrics/metrics.module';

const infra = [LoggerModule, DatabaseModule, RedisModule, MetricsModule];

@Module({
  imports: infra,
  exports: infra,
})
export class InfrastructureModule {}
