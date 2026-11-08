import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { StatsRepository } from '../repositories/stats.repository';
import { GameHistoryRepository } from '@/modules/caravan/repositories/game-history.repository';
import { GameFinishedEvent } from '@/modules/caravan/events/game-finished.event';

@Injectable()
export class StatsBackfillService {
  constructor(
    private readonly gameHistoryRepository: GameHistoryRepository,
    private readonly statsRepository: StatsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StatsBackfillService.name);
  }

  async run(): Promise<number> {
    const games = await this.gameHistoryRepository.findAllForStats();
    let applied = 0;

    for (const game of games) {
      const loserId =
        game.master === game.winnerId ? game.rivalId : game.master;
      const event: GameFinishedEvent = {
        gameId: game.id,
        winnerId: game.winnerId,
        loserId,
        reason: game.resultReason,
        finishedAt: game.createdAt.toISOString(),
        durationSeconds: game.durationSeconds,
      };

      if (await this.statsRepository.applyGameResult(event)) {
        applied += 1;
      }
    }

    this.logger.info(
      { processed: applied, total: games.length },
      'Stats backfill finished',
    );

    return applied;
  }
}
