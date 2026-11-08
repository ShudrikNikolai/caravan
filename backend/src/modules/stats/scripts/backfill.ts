import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../../../app.module';
import { StatsBackfillService } from '../services/stats-backfill.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(StatsBackfillService);
  const processed = await service.run();

  console.log(`Stats backfill processed ${processed} games`);
  await app.close();
}

void main();
