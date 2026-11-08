import { Injectable, NotFoundException } from '@nestjs/common';

import { GameState } from '../domain/game-state';
import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';
import { ForfeitGameUseCase } from './forfeit-game.usecase';

export interface LeaveGameResult {
  state: GameState | null;
  room: Room | null;
  roomRemoved: boolean;
  roomId: string | null;
}

@Injectable()
export class LeaveGameUseCase {
  constructor(
    private readonly gameStateRepository: GameStateRepository,
    private readonly forfeitGameUseCase: ForfeitGameUseCase,
  ) {}

  async execute(userId: string): Promise<LeaveGameResult> {
    const state = await this.gameStateRepository.getGameByUserId(userId);

    if (state) {
      if (state.status !== 'in_progress') {
        return {
          state,
          room: null,
          roomRemoved: false,
          roomId: null,
        };
      }

      const finishedState = await this.forfeitGameUseCase.execute({
        gameId: state.id,
        loserId: userId,
        reason: 'forfeit',
      });

      return {
        state: finishedState,
        room: null,
        roomRemoved: false,
        roomId: null,
      };
    }

    const room = await this.gameStateRepository.getRoomByUserId(userId);

    if (room) {
      const result = await this.gameStateRepository.leaveRoom(room.id, userId);

      return {
        state: null,
        room: result.room,
        roomRemoved: result.removed,
        roomId: room.id,
      };
    }

    throw new NotFoundException('No active game or room found');
  }
}
