import { Injectable, NotFoundException } from '@nestjs/common';
import {
  GameStateRepository,
  Room,
} from '../repositories/game-state.repository';

@Injectable()
export class GetRoomUseCase {
  constructor(private readonly gameStateRepository: GameStateRepository) {}

  async execute(roomId: string): Promise<Room> {
    const room = await this.gameStateRepository.getRoomById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }
}
