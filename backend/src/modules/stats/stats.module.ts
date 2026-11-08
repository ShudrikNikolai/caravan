import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProcessedGame } from './entities/processed-game.entity';
import { UserStats } from './entities/user-stats.entity';
import { StatsRepository } from './repositories/stats.repository';
import { StatsBackfillService } from './services/stats-backfill.service';
import { StatsService } from './services/stats.service';
import { StatsController } from './stats.controller';
import { GetRecentGamesUseCase } from './usecases/get-recent-games.usecase';
import { GetStatsUseCase } from './usecases/get-stats.usecase';
import { CaravanModule } from '../caravan/caravan.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStats, ProcessedGame]),
    CaravanModule,
    UserModule,
  ],
  controllers: [StatsController],
  providers: [
    StatsRepository,
    StatsService,
    StatsBackfillService,
    GetStatsUseCase,
    GetRecentGamesUseCase,
  ],
  exports: [StatsBackfillService],
})
export class StatsModule {}
