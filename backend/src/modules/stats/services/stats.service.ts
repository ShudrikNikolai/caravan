import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';

import { StatsRepository } from '../repositories/stats.repository';
import {
  GAME_FINISHED_EVENT,
  type GameFinishedEvent,
} from '@/modules/caravan/events/game-finished.event';

@Injectable()
export class StatsService {
  constructor(
    private readonly statsRepository: StatsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StatsService.name);
  }

  @OnEvent(GAME_FINISHED_EVENT, { async: true })
  async handleGameFinished(event: GameFinishedEvent): Promise<void> {
    try {
      const applied = await this.statsRepository.applyGameResult(event);

      if (applied) {
        this.logger.info({ gameId: event.gameId }, 'Game stats applied');
      }
    } catch (error: unknown) {
      this.logger.error(
        { err: error, gameId: event.gameId },
        'Failed to apply game stats',
      );
    }
  }
}
