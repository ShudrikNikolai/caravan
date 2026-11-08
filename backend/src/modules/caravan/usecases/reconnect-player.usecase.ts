import { Injectable } from '@nestjs/common';

import { GameEngine } from '../domain/game-engine';
import { GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';

@Injectable()
export class ReconnectPlayerUseCase {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameEngine: GameEngine,
  ) {}

  async execute(userId: string): Promise<GameState | null> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (!state || state.status !== 'in_progress') {
      return null;
    }

    const player = state.players.find((item) => item.id === userId);

    if (!player || player.connected) {
      return state;
    }

    const nextState = this.gameEngine.markReconnected(state, userId);

    await this.gameStateRepository.updateGameState(nextState.id, nextState);
    await this.gameStateRepository.cancelForfeit(state.id, userId);

    return nextState;
  }
}
