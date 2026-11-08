import { Injectable, NotFoundException } from '@nestjs/common';
import { GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';

@Injectable()
export class GetActiveGameUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(userId: string): Promise<GameState> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (!state) {
      throw new NotFoundException('No active game found');
    }

    return state;
  }
}
