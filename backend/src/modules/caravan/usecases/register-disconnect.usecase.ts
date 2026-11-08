import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/config';
import { GameEngine } from '../domain/game-engine';
import { GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';

@Injectable()
export class RegisterDisconnectUseCase {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameEngine: GameEngine,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string): Promise<GameState | null> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (!state || state.status !== 'in_progress') {
      return null;
    }

    const player = state.players.find((item) => item.id === userId);

    if (!player || !player.connected) {
      return state;
    }

    const deadlineAt = Date.now() + this.configService.game.forfeitTimeoutMs;
    const nextState = this.gameEngine.markDisconnected(
      state,
      userId,
      new Date(deadlineAt).toISOString(),
    );

    await this.gameStateRepository.updateGameState(nextState.id, nextState);
    await this.gameStateRepository.scheduleForfeit(
      state.id,
      userId,
      deadlineAt,
    );

    return nextState;
  }
}
