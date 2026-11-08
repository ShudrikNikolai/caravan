import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { StatsPaginationQueryDto } from './schemas/stats-pagination-query.schema';
import { GetRecentGamesUseCase } from './usecases/get-recent-games.usecase';
import { GetStatsUseCase } from './usecases/get-stats.usecase';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(
    private readonly getStatsUseCase: GetStatsUseCase,
    private readonly getRecentGamesUseCase: GetRecentGamesUseCase,
  ) {}

  @Get('me')
  getMyStats(@CurrentUser('id') userId: string) {
    return this.getStatsUseCase.execute(userId);
  }

  @Get('me/games')
  getMyGames(
    @CurrentUser('id') userId: string,
    @Query() query: StatsPaginationQueryDto,
  ) {
    return this.getRecentGamesUseCase.execute(userId, query.page, query.limit);
  }

  @Get(':userId')
  getUserStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.getStatsUseCase.execute(userId);
  }
}
