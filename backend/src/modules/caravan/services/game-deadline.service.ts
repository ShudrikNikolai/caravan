import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { GameStateRepository } from '../repositories/game-state.repository';
import { ForfeitGameUseCase } from '../usecases/forfeit-game.usecase';

const SWEEP_INTERVAL_MS = 1_000;

@Injectable()
export class GameDeadlineService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly forfeitGameUseCase: ForfeitGameUseCase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GameDeadlineService.name);
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.sweep();
    }, SWEEP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async sweep(): Promise<void> {
    if (this.sweeping) {
      return;
    }

    this.sweeping = true;

    try {
      const due = await this.gameStateRepository.getDueForfeits(Date.now());

      for (const item of due) {
        try {
          await this.forfeitGameUseCase.execute({
            gameId: item.gameId,
            loserId: item.userId,
            reason: 'disconnect',
          });
        } catch (error: unknown) {
          this.logger.error(
            { err: error, gameId: item.gameId, userId: item.userId },
            'Failed to process forfeit deadline',
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'Failed to sweep game deadlines');
    } finally {
      this.sweeping = false;
    }
  }
}
