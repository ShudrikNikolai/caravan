import { BadRequestException, Injectable } from '@nestjs/common';

import { GameEngine, GameRuleError } from '../domain/game-engine';
import { GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';
import { ClientEvent } from '../schemas/ws-events.schema';
import { GameResultService } from '../services/game-result.service';

@Injectable()
export class ApplyGameEventUseCase {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly gameEngine: GameEngine,
    private readonly gameResultService: GameResultService,
  ) {}

  async execute(userId: string, event: ClientEvent): Promise<GameState> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (!state) {
      throw new BadRequestException('No active game found');
    }

    let nextState: GameState;

    try {
      nextState = this.gameEngine.applyEvent(state, userId, event);
    } catch (error) {
      if (error instanceof GameRuleError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    if (nextState.status === 'finished' && nextState.winnerId) {
      return this.gameResultService.save(
        nextState,
        nextState.winnerId,
        nextState.finishReason ?? 'normal',
      );
    }

    await this.gameStateRepository.updateGameState(nextState.id, nextState);

    return nextState;
  }
}
