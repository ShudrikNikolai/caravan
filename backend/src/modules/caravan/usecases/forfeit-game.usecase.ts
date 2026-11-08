import { Injectable } from '@nestjs/common';

import { GameEngine } from '../domain/game-engine';
import { GameFinishReason, GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';
import { GameResultService } from '../services/game-result.service';

export interface ForfeitGameCommand {
  gameId: string;
  loserId: string;
  reason: Exclude<GameFinishReason, 'normal'>;
}

@Injectable()
export class ForfeitGameUseCase {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameEngine: GameEngine,
    private readonly gameResultService: GameResultService,
  ) {}

  async execute(command: ForfeitGameCommand): Promise<GameState | null> {
    const state = await this.gameStateRepository.getGameById(command.gameId);

    if (!state || state.status !== 'in_progress') {
      await this.gameStateRepository.cancelForfeit(
        command.gameId,
        command.loserId,
      );
      return null;
    }

    const hasLock = await this.gameStateRepository.tryAcquireFinishLock(
      command.gameId,
    );

    if (!hasLock) {
      return null;
    }

    try {
      const currentState = await this.gameStateRepository.getGameById(
        command.gameId,
      );

      if (!currentState || currentState.status !== 'in_progress') {
        return null;
      }

      const finishedState = this.gameEngine.forfeit(
        currentState,
        command.loserId,
        command.reason,
      );

      if (!finishedState.winnerId) {
        return null;
      }

      return await this.gameResultService.save(
        finishedState,
        finishedState.winnerId,
        command.reason,
      );
    } finally {
      await this.gameStateRepository.releaseFinishLock(command.gameId);
    }
  }
}
