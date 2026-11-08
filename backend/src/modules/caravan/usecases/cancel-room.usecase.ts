import { ForbiddenException, Injectable } from '@nestjs/common';

import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';

@Injectable()
export class CancelRoomUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(roomId: string, userId: string): Promise<Room | null> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      return null;
    }

    const canCancel =
      room.masterId === userId ||
      room.rivalId === userId ||
      room.invitedUserId === userId;

    if (!canCancel) {
      throw new ForbiddenException('You cannot cancel this room');
    }

    await this.gameStateRepository.destroyRoom(roomId);

    return room;
  }
}
