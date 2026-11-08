import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dealInitialState } from '../domain/dealer';
import { GameState } from '../domain/game-state';
import { GameStateRepository } from '../repositories/game-state.repository';

@Injectable()
export class StartGameUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(roomId: string): Promise<GameState> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.rivalId) {
      throw new BadRequestException('Room is not ready');
    }

    const state = dealInitialState(roomId, room.masterId, room.rivalId);

    await this.gameStateRepository.createGame(roomId, state);
    await this.gameStateRepository.removeFromLobby(roomId);

    return state;
  }
}
